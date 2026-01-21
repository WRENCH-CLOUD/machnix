import { UIJob } from "@/modules/job/application/job-transforms-service";

interface UsePrintableFunctionsProps {
  job: UIJob;
  estimateItems: any[];
  invoice: any;
  tenantDetails: any;
  estimate: any;
  notes: string;
}

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param text - The text to escape
 * @returns The escaped text safe for HTML insertion
 */
function escapeHtml(text: string | number | undefined | null): string {
  if (text === null || text === undefined) return "";
  const str = String(text);
  const htmlEscapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return str.replace(/[&<>"']/g, (char) => htmlEscapeMap[char] || char);
}

export const usePrintableFunctions = ({
  job,
  estimateItems,
  invoice,
  tenantDetails,
  estimate,
  notes,
}: UsePrintableFunctionsProps) => {
  const handleGenerateInvoicePdf = () => {
    if (!invoice) {
      window.alert("Unable to generate invoice PDF because no invoice data is available.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.alert("Unable to open a new window for the invoice PDF. Please allow pop-ups and try again.");
      return;
    }

    const partsSubtotal = estimateItems.reduce(
      (acc: number, item: { qty: number; unit_price: number }) =>
        acc + item.qty * item.unit_price,
      0
    );
    const laborSubtotal = estimateItems.reduce(
      (acc: number, item: { labor_cost?: number }) =>
        acc + (item.labor_cost || 0),
      0
    );
    const subtotal = partsSubtotal + laborSubtotal;
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    const customerName = job.customer?.name ?? "";
    const customerPhone = job.customer?.phone ?? "";
    const customerEmail = job.customer?.email ?? "";
    const vehicleTitle = `${job.vehicle?.year ?? ""} ${
      job.vehicle?.make ?? ""
    } ${job.vehicle?.model ?? ""}`.trim();
    const vehicleReg = job.vehicle?.regNo ?? "";

    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice - ${escapeHtml(job.jobNumber)}</title>
        <style>
          @media print {
            @page { margin: 1cm; }
            body { margin: 0; }
          }
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .header-left .title { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
          .header-right { text-align: right; }
          .info { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .section-title { font-weight: bold; margin-bottom: 10px; color: #666; font-size: 12px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border-bottom: 1px solid #ddd; padding: 12px 8px; text-align: left; }
          th { background-color: #f8f8f8; font-weight: bold; border-bottom: 2px solid #333; }
          .text-right { text-align: right; }
          .totals { margin-left: auto; width: 350px; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .total-final { font-weight: bold; font-size: 22px; border-top: 2px solid #000; padding-top: 15px; margin-top: 10px; }
          .paid { color: #059669; }
          .balance { color: #d97706; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <div class="title">INVOICE</div>
            <div>${escapeHtml(invoice.invoice_number || job.jobNumber)}</div>
            <div style="font-size: 12px; color: #666;">Date: ${
              invoice.invoice_date
                ? new Date(invoice.invoice_date).toLocaleDateString()
                : new Date().toLocaleDateString()
            }</div>
          </div>
          <div class="header-right">
            <div style="font-weight: bold; font-size: 18px;">${escapeHtml(
              tenantDetails.name || "Garage"
            )}</div>
            <div style="font-size: 12px;">${escapeHtml(tenantDetails.address || "")}</div>
            ${
              tenantDetails.gstin
                ? `<div style="font-size: 12px;">GSTIN: ${escapeHtml(tenantDetails.gstin)}</div>`
                : ""
            }
          </div>
        </div>
        
        <div class="info">
          <div>
            <div class="section-title">Bill To</div>
            <div style="font-weight: bold; font-size: 16px;">${escapeHtml(customerName)}</div>
            <div style="font-size: 14px;">${escapeHtml(customerPhone)}</div>
            <div style="font-size: 14px;">${escapeHtml(customerEmail)}</div>
          </div>
          <div>
            <div class="section-title">Vehicle</div>
            <div style="font-weight: bold; font-size: 16px;">${escapeHtml(vehicleTitle)}</div>
            <div style="font-size: 14px; font-family: monospace;">${escapeHtml(vehicleReg)}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Rate</th>
              <th class="text-right">Labor</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${estimateItems
              .map(
                (item: {
                  custom_name: string;
                  custom_part_number?: string;
                  qty: number;
                  unit_price: number;
                  labor_cost?: number;
                }) => {
                  const partsAmount = item.qty * item.unit_price;
                  const laborAmount = item.labor_cost || 0;
                  const lineTotal = partsAmount + laborAmount;
                  const partNumber =
                    item.custom_part_number && item.custom_part_number !== ""
                      ? `<div style="font-size: 11px; color: #666;">${escapeHtml(item.custom_part_number)}</div>`
                      : "";

                  return `
                  <tr>
                    <td>
                      <div style="font-weight: 500;">${escapeHtml(item.custom_name)}</div>
                      ${partNumber}
                    </td>
                    <td class="text-right">${escapeHtml(item.qty)}</td>
                    <td class="text-right">₹${item.unit_price.toLocaleString()}</td>
                    <td class="text-right">${
                      laborAmount > 0 ? "₹" + laborAmount.toLocaleString() : "-"
                    }</td>
                    <td class="text-right" style="font-weight: 500;">₹${lineTotal.toLocaleString()}</td>
                  </tr>
                `;
                }
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="totals-row">
            <span>Parts:</span>
            <span>₹${partsSubtotal.toLocaleString()}</span>
          </div>
          <div class="totals-row">
            <span>Labor:</span>
            <span>₹${laborSubtotal.toLocaleString()}</span>
          </div>
          <div class="totals-row" style="padding-top: 10px; border-top: 1px solid #ddd;">
            <span>Subtotal:</span>
            <span>₹${subtotal.toLocaleString()}</span>
          </div>
          <div class="totals-row">
            <span>GST (18%):</span>
            <span>₹${tax.toLocaleString()}</span>
          </div>
          <div class="totals-row total-final">
            <span>Total:</span>
            <span>₹${total.toLocaleString()}</span>
          </div>
          ${
            invoice.paid_amount > 0
              ? `
            <div class="totals-row paid" style="padding-top: 10px; border-top: 1px solid #ddd;">
              <span>Paid:</span>
              <span>₹${Number(invoice.paid_amount).toLocaleString()}</span>
            </div>
            <div class="totals-row balance" style="font-weight: bold; font-size: 18px;">
              <span>Balance Due:</span>
              <span>₹${(total - invoice.paid_amount).toLocaleString()}</span>
            </div>
          `
              : ""
          }
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            }
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(pdfContent);
    printWindow.document.close();
  };

  const handleGenerateEstimatePdf = () => {
    if (!estimate || estimateItems.length === 0) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.alert(
        "Unable to open the estimate PDF window. This is often caused by a popup blocker. Please allow pop-ups for this site and try again."
      );
      return;
    }

    const partsSubtotal =
      estimate.parts_total ??
      estimateItems.reduce(
        (acc: number, item: { qty: number; unit_price: number }) =>
          acc + item.qty * item.unit_price,
        0
      );
    const laborSubtotal =
      estimate.labor_total ??
      estimateItems.reduce(
        (acc: number, item: { labor_cost?: number }) =>
          acc + (item.labor_cost || 0),
        0
      );
    const subtotal = estimate.subtotal ?? partsSubtotal + laborSubtotal;
    const tax = estimate.tax_amount ?? subtotal * 0.18;
    const total = estimate.total_amount ?? subtotal + tax;

    const customerName = job.customer?.name ?? "";
    const customerPhone = job.customer?.phone ?? "";
    const customerEmail = job.customer?.email ?? "";
    const vehicleTitle = `${job.vehicle?.year ?? ""} ${
      job.vehicle?.make ?? ""
    } ${job.vehicle?.model ?? ""}`.trim();
    const vehicleReg = job.vehicle?.regNo ?? "";

    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Estimate - ${escapeHtml(job.jobNumber)}</title>
        <style>
          @media print {
            @page { margin: 1cm; }
            body { margin: 0; }
          }
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { margin-bottom: 30px; }
          .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .info { margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .text-right { text-align: right; }
          .totals { margin-left: auto; width: 350px; margin-top: 20px; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .total-final { font-weight: bold; font-size: 20px; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">ESTIMATE</div>
          <div>Estimate #: ${escapeHtml(estimate.estimate_number || job.jobNumber)}</div>
          <div>Date: ${new Date().toLocaleDateString()}</div>
        </div>
        
        <div class="info">
          <div class="section">
            <div class="section-title">Customer Information</div>
            <div>Name: ${escapeHtml(customerName)}</div>
            <div>Phone: ${escapeHtml(customerPhone)}</div>
            <div>Email: ${escapeHtml(customerEmail)}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Vehicle Information</div>
            <div>${escapeHtml(vehicleTitle)}</div>
            <div>Registration: ${escapeHtml(vehicleReg)}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Part Number</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Labor</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${estimateItems
              .map(
                (item: {
                  custom_name: string;
                  custom_part_number?: string;
                  qty: number;
                  unit_price: number;
                  labor_cost?: number;
                }) => {
                  const partsAmount = item.qty * item.unit_price;
                  const laborAmount = item.labor_cost || 0;
                  const lineTotal = partsAmount + laborAmount;
                  const partNumber =
                    item.custom_part_number && item.custom_part_number !== ""
                      ? escapeHtml(item.custom_part_number)
                      : "-";
                  return `
                  <tr>
                    <td>${escapeHtml(item.custom_name)}</td>
                    <td>${partNumber}</td>
                    <td class="text-right">${escapeHtml(item.qty)}</td>
                    <td class="text-right">₹${item.unit_price.toLocaleString()}</td>
                    <td class="text-right">${
                      laborAmount > 0 ? "₹" + laborAmount.toLocaleString() : "-"
                    }</td>
                    <td class="text-right">₹${lineTotal.toLocaleString()}</td>
                  </tr>
                `;
                }
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="totals-row">
            <span>Parts Subtotal:</span>
            <span>₹${partsSubtotal.toLocaleString()}</span>
          </div>
          <div class="totals-row">
            <span>Labor Subtotal:</span>
            <span>₹${laborSubtotal.toLocaleString()}</span>
          </div>
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>₹${subtotal.toLocaleString()}</span>
          </div>
          <div class="totals-row">
            <span>GST (18%):</span>
            <span>₹${tax.toLocaleString()}</span>
          </div>
          <div class="totals-row total-final">
            <span>Total:</span>
            <span>₹${total.toLocaleString()}</span>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            }
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(pdfContent);
    printWindow.document.close();
  };

  const handleGenerateJobPdf = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const customerName = job.customer?.name ?? "N/A";
    const customerPhone = job.customer?.phone ?? "N/A";
    const customerEmail = job.customer?.email ?? "N/A";
    
    const vehicleTitle = `${job.vehicle?.year ?? ""} ${
      job.vehicle?.make ?? ""
    } ${job.vehicle?.model ?? ""}`.trim();
    const vehicleReg = job.vehicle?.regNo ?? "N/A";

    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Job Card - ${escapeHtml(job.jobNumber)}</title>
        <style>
          @media print {
            @page { margin: 1cm; }
            body { margin: 0; }
          }
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; color: #333; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .header-left h1 { margin: 0; font-size: 28px; font-weight: bold; }
          .job-number { font-size: 18px; color: #666; margin-top: 5px; }
          .header-right { text-align: right; }
          .status-badge { 
            display: inline-block; padding: 6px 12px; border-radius: 4px; 
            font-weight: bold; font-size: 14px; text-transform: uppercase;
            background-color: #eee; border: 1px solid #ddd;
          }
          
          .grid-container { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 14px; text-transform: uppercase; color: #666; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
          
          .info-row { display: flex; margin-bottom: 8px; }
          .info-label { width: 100px; font-weight: bold; color: #555; }
          .info-value { flex: 1; }
          
          .description-box { border: 1px solid #ddd; padding: 15px; border-radius: 4px; min-height: 100px; background-color: #f9f9f9; }
          
          .checklist { margin-top: 30px; }
          .checklist-item { display: flex; align-items: center; margin-bottom: 10px; padding: 10px; border-bottom: 1px solid #eee; }
          .checkbox { width: 20px; height: 20px; border: 2px solid #333; margin-right: 15px; }
          
          .footer { margin-top: 50px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <h1>JOB CARD</h1>
            <div class="job-number">#${escapeHtml(job.jobNumber)}</div>
          </div>
          <div class="header-right">
            <div style="font-size: 14px; margin-bottom: 5px;">Created: ${new Date(job.createdAt).toLocaleDateString()}</div>
            <div class="status-badge">${job.status}</div>
          </div>
        </div>
        
        <div class="grid-container">
          <div class="section">
            <div class="section-title">Customer Details</div>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value">${escapeHtml(customerName)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span class="info-value">${escapeHtml(customerPhone)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${escapeHtml(customerEmail)}</span>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Vehicle Details</div>
            <div class="info-row">
              <span class="info-label">Vehicle:</span>
              <span class="info-value"><strong>${escapeHtml(vehicleTitle)}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Reg No:</span>
              <span class="info-value" style="font-family: monospace; font-size: 16px;">${escapeHtml(vehicleReg)}</span>
            </div>
          </div>
        </div>
        

        <div class="section">
           <div class="section-title">Mechanic Notes</div>
           <div class="description-box" style="height: 150px;">${escapeHtml(notes)}</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            }
          }
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(pdfContent);
    printWindow.document.close();
  }

  return {
    handleGenerateInvoicePdf,
    handleGenerateEstimatePdf,
    handleGenerateJobPdf,
  };
};
