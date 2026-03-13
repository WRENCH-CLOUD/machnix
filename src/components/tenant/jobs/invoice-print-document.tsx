"use client";

import { type UIJob } from "@/modules/job/application/job-transforms-service";

export type InvoiceTemplateVariant = "standard" | "compact" | "detailed";
export type InvoiceTemplateMode = "auto" | InvoiceTemplateVariant;

interface InvoiceItem {
  id: string;
  name: string;
  partNumber?: string | null;
  qty: number;
  unitPrice: number;
  laborCost: number;
  lineTotal: number;
}

interface InvoicePrintTenant {
  name: string;
  address: string;
  gstin?: string;
  panNumber?: string;
  placeOfSupply?: string;
  termsAndConditions?: string[];
  primaryColor?: string;
  templatePreference?: InvoiceTemplateMode;
}

export interface InvoicePrintData {
  title: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleTitle: string;
  vehicleReg: string;
  items: InvoiceItem[];
  partsSubtotal: number;
  laborSubtotal: number;
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  isGstBilled: boolean;
  tenant: InvoicePrintTenant;
}

interface BuildInvoicePrintDataArgs {
  job: UIJob;
  estimateItems: Array<{
    id?: string;
    custom_name?: string;
    custom_part_number?: string;
    qty?: number;
    unit_price?: number;
    labor_cost?: number;
  }>;
  invoice: any;
  tenantDetails: any;
  isGstBilled: boolean;
  discountPercentage: number;
}

export function resolveInvoiceTemplate(
  mode: InvoiceTemplateMode,
  data: InvoicePrintData
): InvoiceTemplateVariant {
  if (mode !== "auto") {
    return mode;
  }

  if (data.tenant.templatePreference && data.tenant.templatePreference !== "auto") {
    return data.tenant.templatePreference;
  }

  if (data.items.length >= 11) {
    return "compact";
  }

  if (data.isGstBilled && Boolean(data.tenant.gstin)) {
    return "detailed";
  }

  return "standard";
}

export function buildInvoicePrintData({
  job,
  estimateItems,
  invoice,
  tenantDetails,
  isGstBilled,
  discountPercentage,
}: BuildInvoicePrintDataArgs): InvoicePrintData {
  const items: InvoiceItem[] = estimateItems.map((item, index) => {
    const qty = Number(item.qty || 0);
    const unitPrice = Number(item.unit_price || 0);
    const laborCost = Number(item.labor_cost || 0);
    const lineTotal = qty * unitPrice + laborCost;

    return {
      id: String(item.id || index),
      name: item.custom_name || "Unnamed item",
      partNumber: item.custom_part_number || null,
      qty,
      unitPrice,
      laborCost,
      lineTotal,
    };
  });

  const partsSubtotal = items.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);
  const laborSubtotal = items.reduce((acc, item) => acc + item.laborCost, 0);
  const subtotal = partsSubtotal + laborSubtotal;

  const liveDiscountAmount = subtotal * (discountPercentage / 100);
  const taxableAmount = subtotal - liveDiscountAmount;
  const liveTaxAmount = isGstBilled ? taxableAmount * 0.18 : 0;
  const liveTotal = taxableAmount + liveTaxAmount;

  const finalDiscount = Number(invoice?.discount_amount ?? liveDiscountAmount);
  const finalTax = Number(invoice?.tax_amount ?? liveTaxAmount);
  const finalTotal = Number(invoice?.total_amount ?? liveTotal);
  const paidAmount = Number(invoice?.paid_amount ?? invoice?.paidAmount ?? 0);

  const finalIsGstBilled = Boolean(invoice?.is_gst_billed ?? isGstBilled);
  const finalDiscountPercentage = Number(invoice?.discount_percentage ?? discountPercentage);

  const dateValue = invoice?.invoice_date
    ? new Date(invoice.invoice_date)
    : new Date();

  const dueDate = invoice?.due_date ? new Date(invoice.due_date) : undefined;

  const vehicleTitle = `${job.vehicle?.year ?? ""} ${job.vehicle?.make ?? ""} ${job.vehicle?.model ?? ""}`.trim();

  const defaultTerms = [
    "Goods once sold will not be taken back or exchanged.",
    "All disputes are subject to local jurisdiction.",
  ];

  const termsAndConditions = Array.isArray(tenantDetails?.termsAndConditions)
    ? tenantDetails.termsAndConditions
    : Array.isArray(tenantDetails?.invoiceTerms)
      ? tenantDetails.invoiceTerms
      : defaultTerms;

  return {
    title: finalIsGstBilled ? "TAX INVOICE" : "BILL OF SUPPLY",
    invoiceNumber: String(invoice?.invoice_number || job.jobNumber || "-"),
    invoiceDate: dateValue.toLocaleDateString("en-IN"),
    dueDate: dueDate ? dueDate.toLocaleDateString("en-IN") : undefined,
    customerName: job.customer?.name || "",
    customerPhone: job.customer?.phone || "",
    customerEmail: job.customer?.email || "",
    vehicleTitle,
    vehicleReg: job.vehicle?.regNo || "",
    items,
    partsSubtotal,
    laborSubtotal,
    subtotal,
    discountPercentage: finalDiscountPercentage,
    discountAmount: finalDiscount,
    taxAmount: finalTax,
    totalAmount: finalTotal,
    paidAmount,
    balanceDue: Math.max(0, finalTotal - paidAmount),
    isGstBilled: finalIsGstBilled,
    tenant: {
      name: tenantDetails?.name || "Garage",
      address: tenantDetails?.address || "",
      gstin: tenantDetails?.gstin || "",
      panNumber: tenantDetails?.panNumber || tenantDetails?.pan_number || "",
      placeOfSupply: tenantDetails?.placeOfSupply || tenantDetails?.place_of_supply || "",
      termsAndConditions,
      primaryColor: tenantDetails?.primaryColor || tenantDetails?.primary_color || "#111827",
      templatePreference: tenantDetails?.templatePreference || tenantDetails?.invoiceTemplate,
    },
  };
}

interface InvoicePrintDocumentProps {
  data: InvoicePrintData;
  variant: InvoiceTemplateVariant;
  printMode?: boolean;
}

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

function InvoiceTotals({
  data,
  compact = false,
  bordered = false,
}: {
  data: InvoicePrintData;
  compact?: boolean;
  bordered?: boolean;
}) {
  return (
    <div
      className={[
        "w-full max-w-xs space-y-1 text-sm",
        compact ? "text-xs" : "text-sm",
        bordered ? "border border-gray-300 rounded-md p-3" : "",
      ].join(" ")}
    >
      <div className="flex justify-between">
        <span>Parts</span>
        <span>{formatINR(data.partsSubtotal)}</span>
      </div>
      <div className="flex justify-between">-
        <span>Labor</span>
        <span>{formatINR(data.laborSubtotal)}</span>
      </div>
      <div className="flex justify-between border-t border-gray-300 pt-2">
        <span>Taxable Amount</span>
        <span>{formatINR(data.subtotal - data.discountAmount)}</span>
      </div>
      {data.discountAmount > 0 && (
        <div className="flex justify-between text-amber-700">
          <span>Discount ({data.discountPercentage}%)</span>
          <span>-{formatINR(data.discountAmount)}</span>
        </div>
      )}
      {data.isGstBilled && (
        <>
          <div className="flex justify-between">
            <span>CGST @9%</span>
            <span>{formatINR(data.taxAmount / 2)}</span>
          </div>
          <div className="flex justify-between">
            <span>SGST @9%</span>
            <span>{formatINR(data.taxAmount / 2)}</span>
          </div>
        </>
      )}
      <div className="flex justify-between border-t-2 border-gray-800 pt-2 text-base font-bold">
        <span>Total Amount</span>
        <span>{formatINR(data.totalAmount)}</span>
      </div>
      <div className="flex justify-between">
        <span>Received Amount</span>
        <span>{formatINR(data.paidAmount)}</span>
      </div>
      {data.balanceDue > 0 && (
        <div className="flex justify-between text-amber-700 font-semibold">
          <span>Balance Due</span>
          <span>{formatINR(data.balanceDue)}</span>
        </div>
      )}
    </div>
  );
}

function StandardTemplate({ data }: { data: InvoicePrintData }) {
  return (
    <div className="p-6 bg-linear-to-b from-slate-50 to-white">
      <div className="border-l-8 border-slate-800 bg-white shadow-sm rounded-lg p-5">
        <div className="flex items-start justify-between gap-5 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Customer Invoice</p>
            <h2 className="text-2xl font-black text-slate-900 mt-1">{data.title}</h2>
            <p className="text-sm text-slate-700 mt-1.5">Invoice No: {data.invoiceNumber}</p>
            <p className="text-sm text-slate-700">Invoice Date: {data.invoiceDate}</p>
            {data.dueDate ? <p className="text-sm text-slate-700">Due Date: {data.dueDate}</p> : null}
          </div>
          <div className="text-right max-w-[52%]">
            <h3 className="text-2xl font-extrabold text-slate-900">{data.tenant.name}</h3>
            <p className="text-sm text-slate-700 whitespace-pre-line mt-1">{data.tenant.address}</p>
            {data.tenant.gstin ? <p className="text-sm text-slate-700 mt-1">GSTIN: {data.tenant.gstin}</p> : null}
            {data.tenant.panNumber ? <p className="text-sm text-slate-700">PAN: {data.tenant.panNumber}</p> : null}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-5 text-sm">
          <div className="rounded-md bg-slate-50 border border-slate-200 p-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Bill To</p>
            <p className="font-semibold text-slate-900">{data.customerName || "-"}</p>
            <p>{data.customerPhone || "-"}</p>
            {data.customerEmail ? <p>{data.customerEmail}</p> : null}
          </div>
          <div className="rounded-md bg-slate-50 border border-slate-200 p-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Ship To</p>
            <p className="font-semibold text-slate-900">{data.customerName || "-"}</p>
            <p>{data.customerPhone || "-"}</p>
          </div>
          <div className="rounded-md bg-slate-50 border border-slate-200 p-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Vehicle</p>
            <p className="font-semibold text-slate-900">{data.vehicleReg || "-"}</p>
            <p>{data.vehicleTitle || "-"}</p>
          </div>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="text-left py-1.5 px-2 text-xs uppercase tracking-wide">Item</th>
              <th className="text-right py-1.5 px-2 text-xs uppercase tracking-wide">Qty</th>
              <th className="text-right py-1.5 px-2 text-xs uppercase tracking-wide">Rate</th>
              <th className="text-right py-1.5 px-2 text-xs uppercase tracking-wide">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <tr key={item.id} className={idx % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                <td className="py-1.5 px-2 align-top text-sm">
                  <p className="font-medium text-slate-900">{item.name}</p>
                  {item.partNumber ? <p className="text-xs text-slate-500">{item.partNumber}</p> : null}
                </td>
                <td className="py-1.5 px-2 text-right text-sm">{item.qty}</td>
                <td className="py-1.5 px-2 text-right text-sm">{formatINR(item.unitPrice)}</td>
                <td className="py-1.5 px-2 text-right text-sm font-semibold">{formatINR(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Terms and Conditions</p>
            <ul className="list-disc pl-4 space-y-1 text-sm text-slate-700">
              {data.tenant.termsAndConditions?.map((term) => (
                <li key={term}>{term}</li>
              ))}
            </ul>
          </div>
          <div className="justify-self-end">
            <InvoiceTotals data={data} compact bordered />
          </div>
        </div>
      </div>
    </div>
  );
}

function CompactTemplate({ data }: { data: InvoicePrintData }) {
  return (
    <div className="p-6 bg-white font-sans text-sm">
      <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">{data.title}</h2>
          <div className="text-xs text-slate-600 mt-2 flex gap-4">
             <p>INV: <span className="font-semibold text-slate-900">{data.invoiceNumber}</span></p>
             <p>DATE: <span className="font-semibold text-slate-900">{data.invoiceDate}</span></p>
             {data.dueDate && <p>DUE: <span className="font-semibold text-slate-900">{data.dueDate}</span></p>}
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-lg font-bold text-slate-900 uppercase">{data.tenant.name}</h1>
          <p className="text-xs text-slate-600 max-w-62.5 whitespace-pre-line leading-tight mt-1">{data.tenant.address}</p>
          {data.tenant.gstin && <p className="text-[10px] text-slate-500 mt-1">GSTIN: {data.tenant.gstin}</p>}
        </div>
      </div>

      <div className="flex justify-between bg-slate-50 border border-slate-100 p-3 rounded-md mb-4 text-xs">
        <div>
          <p className="font-semibold text-slate-900 uppercase mb-1 text-[10px] tracking-wider">Bill To</p>
          <p className="font-medium text-slate-900">{data.customerName || "-"}</p>
          <p className="text-slate-600">{data.customerPhone || "-"}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-slate-900 uppercase mb-1 text-[10px] tracking-wider">Vehicle</p>
          <p className="font-medium text-slate-900">{data.vehicleReg || "-"}</p>
          <p className="text-slate-600">{data.vehicleTitle || "-"}</p>
        </div>
      </div>

      <table className="w-full text-xs mb-4">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="text-left py-2 font-semibold text-slate-900 uppercase tracking-wide text-[10px]">Item</th>
            <th className="text-center py-2 font-semibold text-slate-900 uppercase tracking-wide text-[10px]">Qty</th>
            <th className="text-right py-2 font-semibold text-slate-900 uppercase tracking-wide text-[10px]">Rate</th>
            <th className="text-right py-2 font-semibold text-slate-900 uppercase tracking-wide text-[10px]">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.items.map((item) => (
             <tr key={item.id}>
              <td className="py-2 align-top">
                <div className="font-medium text-slate-900">{item.name}</div>
                {item.partNumber && <div className="text-[10px] text-slate-500">{item.partNumber}</div>}
              </td>
              <td className="py-2 text-center text-slate-700 align-top">{item.qty}</td>
              <td className="py-2 text-right text-slate-700 align-top">{formatINR(item.unitPrice)}</td>
              <td className="py-2 text-right font-medium text-slate-900 align-top">{formatINR(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-start pt-4 border-t-2 border-slate-200">
         <div className="text-[10px] text-slate-500 w-1/2 pr-4">
          <p className="font-semibold text-slate-700 uppercase mb-1 tracking-wider">Terms</p>
          <ul className="list-disc pl-3 mt-1 space-y-0.5">
            {data.tenant.termsAndConditions?.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
        </div>
        <div className="w-1/2 max-w-60">
          <InvoiceTotals data={data} compact />
        </div>
      </div>
    </div>
  );
}

function DetailedTemplate({ data }: { data: InvoicePrintData }) {
  return (
    <div className="p-6 bg-white font-serif">
      <div className="border border-gray-800">
        <div className="bg-gray-900 text-white px-5 py-2.5 flex items-center justify-between">
          <div>
            <p className="text-xs/2 uppercase tracking-[0.25em]">Tax Document</p>
            <h2 className="text-lg/2 font-bold leading-tight">{data.title}</h2>
          </div>
          <span className="text-xs/2 uppercase border border-white/40 px-3 py-1">Original for recipient</span>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-300 p-2.5">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">From</p>
              <p className="text-lg font-bold text-gray-900 leading-tight">{data.tenant.name}</p>
              <p className="text-sm text-gray-700 whitespace-pre-line mt-1">{data.tenant.address}</p>
              <div className="text-sm text-gray-700 mt-2">
                {data.tenant.gstin ? <p>GSTIN: {data.tenant.gstin}</p> : null}
                {data.tenant.panNumber ? <p>PAN: {data.tenant.panNumber}</p> : null}
                {data.tenant.placeOfSupply ? <p>Place of Supply: {data.tenant.placeOfSupply}</p> : null}
              </div>
            </div>
            <div className="border border-gray-300 p-2.5">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Document Info</p>
              <p className="text-sm"><strong>Invoice No:</strong> {data.invoiceNumber}</p>
              <p className="text-sm"><strong>Invoice Date:</strong> {data.invoiceDate}</p>
              {data.dueDate ? <p className="text-sm"><strong>Due Date:</strong> {data.dueDate}</p> : null}
              <div className="mt-2 pt-2 border-t border-gray-200 text-sm">
                <p><strong>Bill To:</strong> {data.customerName || "-"}</p>
                <p><strong>Phone:</strong> {data.customerPhone || "-"}</p>
                {data.customerEmail ? <p><strong>Email:</strong> {data.customerEmail}</p> : null}
                <p><strong>Vehicle:</strong> {data.vehicleReg || "-"}</p>
              </div>
            </div>
          </div>

          <table className="w-full border-collapse mt-4 text-sm">
            <thead>
              <tr>
                <th className="border border-gray-700 bg-gray-100 text-left px-2 py-1.5 uppercase tracking-wide text-xs">Description</th>
                <th className="border border-gray-700 bg-gray-100 text-right px-2 py-1.5 uppercase tracking-wide text-xs">Qty</th>
                <th className="border border-gray-700 bg-gray-100 text-right px-2 py-1.5 uppercase tracking-wide text-xs">Rate</th>
                <th className="border border-gray-700 bg-gray-100 text-right px-2 py-1.5 uppercase tracking-wide text-xs">Tax</th>
                <th className="border border-gray-700 bg-gray-100 text-right px-2 py-1.5 uppercase tracking-wide text-xs">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id}>
                  <td className="border border-gray-300 px-2 py-1.5 align-top">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    {item.partNumber ? <p className="text-xs text-gray-600">Part No: {item.partNumber}</p> : null}
                  </td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right">{item.qty}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right">{formatINR(item.unitPrice)}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right">{formatINR(data.isGstBilled ? item.lineTotal * 0.18 : 0)}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right font-semibold">{formatINR(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-300 p-2.5 text-sm">
              <p className="font-semibold uppercase tracking-wide mb-2">Terms and Conditions</p>
              <ol className="list-decimal pl-4 space-y-1">
                {data.tenant.termsAndConditions?.map((term) => (
                  <li key={term}>{term}</li>
                ))}
              </ol>
            </div>
            <div className="justify-self-end">
              <InvoiceTotals data={data} compact bordered />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InvoicePrintDocument({
  data,
  variant,
  printMode = false,
}: InvoicePrintDocumentProps) {
  return (
    <div
      className={[
        "bg-white text-black border border-gray-200 rounded-xl overflow-hidden",
        printMode ? "invoice-print-root border-none rounded-none" : "",
      ].join(" ")}
    >
      {variant === "standard" && <StandardTemplate data={data} />}
      {variant === "compact" && <CompactTemplate data={data} />}
      {variant === "detailed" && <DetailedTemplate data={data} />}
    </div>
  );
}
