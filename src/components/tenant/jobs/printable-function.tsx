import { UIJob } from "@/modules/job/application/job-transforms-service";

// Task type for printing - simplified from JobCardTask
interface PrintableTask {
  id: string;
  taskName: string;
  actionType: 'LABOR_ONLY' | 'REPLACED';
  taskStatus: string;
}

interface UsePrintableFunctionsProps {
  job: UIJob;
  estimateItems: any[];
  invoice: any;
  tenantDetails: any;
  estimate: any;
  notes: string;
  tasks?: PrintableTask[];
  serviceHistory?: {
    totalJobs: number;
    recentJob: {
      jobNumber: string;
      createdAt: string;
      partsWorkedOn: Array<{ name: string; status: string }>;
    } | null;
  };
  // GST and discount from local state (for immediate PDF updates)
  isGstBilled: boolean;
  discountPercentage: number;
}

/**
 * HTML escape map for preventing XSS attacks
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param text - The text to escape
 * @returns The escaped text safe for HTML insertion
 */
function escapeHtml(text: string | number | undefined | null): string {
  if (text === null || text === undefined) return "";
  const str = String(text);
  return str.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}

export const usePrintableFunctions = ({
  job,
  estimateItems,
  invoice,
  tenantDetails,
  estimate,
  notes,
  tasks = [],
  serviceHistory,
  isGstBilled,
  discountPercentage,
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

    // Use local state values for GST and discount (passed as props)
    const discountAmount = subtotal * (discountPercentage / 100);
    const taxableAmount = subtotal - discountAmount;
    const tax = isGstBilled ? taxableAmount * 0.18 : 0;
    const total = taxableAmount + tax;

    const customerName = job.customer?.name ?? "";
    const customerPhone = job.customer?.phone ?? "";
    const customerEmail = job.customer?.email ?? "";
    const vehicleTitle = `${job.vehicle?.year ?? ""} ${job.vehicle?.make ?? ""
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
            <div class="title">${isGstBilled ? 'TAX INVOICE' : 'BILL OF SUPPLY'}</div>
            <div>${escapeHtml(invoice.invoice_number || job.jobNumber)}</div>
            <div style="font-size: 12px; color: #666;">Date: ${invoice.invoice_date
        ? new Date(invoice.invoice_date).toLocaleDateString()
        : new Date().toLocaleDateString()
      }</div>
          </div>
          <div class="header-right">
            <div style="font-weight: bold; font-size: 18px;">${escapeHtml(
        tenantDetails.name || "Garage"
      )}</div>
            <div style="font-size: 12px;">${escapeHtml(tenantDetails.address || "")}</div>
            ${tenantDetails.gstin
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
                    <td class="text-right">${laborAmount > 0 ? "₹" + laborAmount.toLocaleString() : "-"
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
          ${discountPercentage > 0 ? `
          <div class="totals-row">
            <span>Discount (${discountPercentage}%):</span>
            <span>-₹${discountAmount.toLocaleString()}</span>
          </div>
          ` : ''}
          ${isGstBilled ? `
          <div class="totals-row">
            <span>GST (18%):</span>
            <span>₹${tax.toLocaleString()}</span>
          </div>
          ` : ''}
          <div class="totals-row total-final">
            <span>Total:</span>
            <span>₹${total.toLocaleString()}</span>
          </div>
          ${invoice.paidAmount > 0
        ? `
            <div class="totals-row paid" style="padding-top: 10px; border-top: 1px solid #ddd;">
              <span>Paid:</span>
              <span>₹${Number(invoice.paidAmount).toLocaleString()}</span>
            </div>
            <div class="totals-row balance" style="font-weight: bold; font-size: 18px;">
              <span>Balance Due:</span>
              <span>₹${(total - invoice.paidAmount).toLocaleString()}</span>
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
    const vehicleTitle = `${job.vehicle?.year ?? ""} ${job.vehicle?.make ?? ""
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
                    <td class="text-right">${laborAmount > 0 ? "₹" + laborAmount.toLocaleString() : "-"
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

    const vehicleTitle = `${job.vehicle?.year ?? ""} ${job.vehicle?.make ?? ""
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
            @page { margin: 0.5cm; }
            body { margin: 0; }
          }
          body { font-family: Arial, sans-serif; padding: 10px; max-width: 800px; margin: 0 auto; color: #333; line-height: 1.2; word-wrap: break-word; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px; }
          .header-left h1 { margin: 0; font-size: 20px; font-weight: bold; }
          .job-number { font-size: 14px; color: #666; margin-top: 2px; }
          .header-right { text-align: right; word-break: break-word; max-width: 200px; }
          .status-badge { 
            display: inline-block; padding: 3px 8px; border-radius: 4px; 
            font-weight: bold; font-size: 11px; text-transform: uppercase;
            background-color: #eee; border: 1px solid #ddd;
          }
          
          .grid-container { display: grid; grid-template-columns: 1fr 1.2fr; gap: 15px; margin-bottom: 15px; }
          .section { margin-bottom: 12px; }
          .section-title { font-size: 11px; text-transform: uppercase; color: #666; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin-bottom: 5px; }
          
          .info-row { display: flex; margin-bottom: 3px; }
          .info-label { width: 65px; font-weight: bold; color: #555; font-size: 11px; flex-shrink: 0; }
          .info-value { flex: 1; font-size: 11px; word-break: break-word; overflow-wrap: break-word; }
          
          .vehicle-highlight { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 5px 8px; border-radius: 4px; }
          .vehicle-title { color: #1e40af; font-size: 13px; }
          
          .task-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; table-layout: fixed; }
          .task-table th, .task-table td { border: 1px solid #333; padding: 6px 8px; font-size: 11px; word-break: break-word; overflow-wrap: break-word; }
          .task-table th { background-color: #f0f0f0; font-weight: bold; text-align: left; padding: 6px 8px; }
          .task-cell { vertical-align: middle; min-height: 35px; max-width: 0; word-break: break-word; hyphens: auto; }
          .status-cell { vertical-align: middle; }
          .status-checkboxes { display: flex; justify-content: space-around; gap: 4px; }
          .status-option { display: flex; align-items: center; gap: 2px; font-size: 9px; font-weight: bold; }
          .checkbox { width: 10px; height: 10px; border: 1px solid #333; display: inline-flex; align-items: center; justify-content: center; font-size: 8px; flex-shrink: 0; }
          .checkbox.checked { background-color: #333; color: white; }
          
          .notes-box { border: 1px solid #ddd; padding: 8px; border-radius: 4px; min-height: 40px; background-color: #f9f9f9; font-size: 11px; white-space: pre-wrap; word-break: break-word; overflow-wrap: break-word; }
          
          .history-section { border: 1px solid #ddd; padding: 8px; border-radius: 4px; margin-top: 10px; background-color: #fff; }
          .history-badge { display: inline-block; background-color: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 10px; margin-left: 5px; border: 1px solid #e5e7eb; }
          .history-parts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; margin-top: 5px; }
          .history-part { font-size: 10px; padding: 3px 6px; border-radius: 3px; border: 1px solid #eee; display: flex; align-items: center; gap: 4px; word-break: break-word; overflow-wrap: break-word; }
          .history-part.changed { border-color: #bfdbfe; background-color: #eff6ff; color: #1e40af; }
          .history-part.repaired { border-color: #bbf7d0; background-color: #f0fdf4; color: #166534; }
          
          .footer { margin-top: 10px; font-size: 9px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 5px; }

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
              <span class="info-value"><strong>${escapeHtml(customerName)}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span class="info-value">${escapeHtml(customerPhone)}</span>
            </div>
          </div>
          
          <div class="section vehicle-highlight">
            <div class="section-title" style="color: #1e40af; border-bottom-color: #bfdbfe;">Vehicle Information</div>
            <div class="info-row">
              <span class="info-label">Vehicle:</span>
              <span class="info-value vehicle-title"><strong>${escapeHtml(vehicleTitle)}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Reg No:</span>
              <span class="info-value" style="font-family: monospace; font-size: 14px; font-weight: bold;">${escapeHtml(vehicleReg)}</span>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Task List</div>
          <table class="task-table">
            <thead>
              <tr>
                <th style="width: 25%;">Part / Task</th>
                <th style="width: 25%; text-align: center;">Status</th>
                <th style="width: 25%;">Part / Task</th>
                <th style="width: 25%; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${(() => {
        const rows: string[] = [];
        const totalRows = Math.max(9, Math.ceil(tasks.length / 2));
        for (let i = 0; i < totalRows; i++) {
          const leftIdx = i;
          const rightIdx = i + totalRows;
          const leftTask = tasks[leftIdx];
          const rightTask = tasks[rightIdx];

          // Map task action types to display: REPLACED -> R (Replaced), LABOR_ONLY -> L (Labor Only)
          const leftChanged = leftTask?.actionType === 'REPLACED';
          const leftLaborOnly = leftTask?.actionType === 'LABOR_ONLY';
          const leftCompleted = leftTask?.taskStatus === 'COMPLETED';

          const rightChanged = rightTask?.actionType === 'REPLACED';
          const rightLaborOnly = rightTask?.actionType === 'LABOR_ONLY';
          const rightCompleted = rightTask?.taskStatus === 'COMPLETED';

          const leftStyle = leftCompleted ? 'text-decoration: line-through; color: #888;' : '';
          const rightStyle = rightCompleted ? 'text-decoration: line-through; color: #888;' : '';

          rows.push('<tr>' +
            '<td class="task-cell" style="' + leftStyle + '">' + (leftTask ? escapeHtml(leftTask.taskName) : '') + '</td>' +
            '<td class="status-cell"><div class="status-checkboxes">' +
            '<span class="status-option"><span class="checkbox ' + (leftChanged ? 'checked' : '') + '">' + (leftChanged ? '✓' : '') + '</span>R</span>' +
            '<span class="status-option"><span class="checkbox ' + (leftLaborOnly ? 'checked' : '') + '">' + (leftLaborOnly ? '✓' : '') + '</span>L</span>' +
            '</div></td>' +
            '<td class="task-cell" style="' + rightStyle + '">' + (rightTask ? escapeHtml(rightTask.taskName) : '') + '</td>' +
            '<td class="status-cell"><div class="status-checkboxes">' +
            '<span class="status-option"><span class="checkbox ' + (rightChanged ? 'checked' : '') + '">' + (rightChanged ? '✓' : '') + '</span>R</span>' +
            '<span class="status-option"><span class="checkbox ' + (rightLaborOnly ? 'checked' : '') + '">' + (rightLaborOnly ? '✓' : '') + '</span>L</span>' +
            '</div></td>' +
            '</tr>');
        }
        return rows.join('');
      })()}
      })()}
            </tbody>
          </table>
          <div style="font-size: 9px; color: #666; margin-top: 2px;">R = Replaced | L = Labor Only</div>
        </div>

        <div class="section">
          <div class="section-title">Mechanic Notes</div>
          <div class="notes-box">${escapeHtml(notes) || '<span style="color: #999; font-style: italic;">No notes recorded</span>'}</div>
        </div>

        ${serviceHistory && serviceHistory.totalJobs > 1 && serviceHistory.recentJob ? `
        <div class="section history-section">
          <div class="section-title" style="border-bottom: none; margin-bottom: 3px; font-size: 12px; color: #333;">
            LAST SERVICE HISTORY
            <span class="history-badge">${serviceHistory.totalJobs - 1} previous visit${serviceHistory.totalJobs > 2 ? 's' : ''}</span>
          </div>
          <div style="font-size: 11px; margin-bottom: 5px;">
            <strong>Job #${escapeHtml(serviceHistory.recentJob.jobNumber)}</strong> | 
            <strong>Date:</strong> ${new Date(serviceHistory.recentJob.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          ${serviceHistory.recentJob.partsWorkedOn.length > 0 ? `
          <div class="history-parts">
            ${serviceHistory.recentJob.partsWorkedOn.map(part => `
              <div class="history-part ${part.status}">
                <span style="font-size: 12px;">${part.status === 'changed' ? '↻' : '🔧'}</span>
                <strong>${escapeHtml(part.name)}</strong>
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>
        ` : ''}

        <div class="section" style="margin-top: 15px; page-break-inside: avoid;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
            <div>
              <div class="section-title">Assigned Mechanic</div>
              <div style="font-size: 12px; margin-bottom: 8px;">
                ${job.mechanic ? `<strong>${escapeHtml(job.mechanic.name)}</strong>${job.mechanic.phone ? ` | ${escapeHtml(job.mechanic.phone)}` : ''}` : '<span style="color: #999; font-style: italic;">Not assigned</span>'}
              </div>
              <div style="border-bottom: 1px solid #333; height: 30px; margin-top: 20px;"></div>
              <div style="font-size: 10px; color: #666; margin-top: 3px;">Mechanic Signature</div>
            </div>
            <div>
              <div class="section-title">Customer Acknowledgment</div>
              <div style="font-size: 11px; color: #666; margin-bottom: 8px;">
                I acknowledge receipt of the vehicle and agree to the work performed.
              </div>
              <div style="border-bottom: 1px solid #333; height: 30px; margin-top: 20px;"></div>
              <div style="font-size: 10px; color: #666; margin-top: 3px;">Customer Signature</div>
            </div>
          </div>
        </div>

        <div class="footer">
          Printed on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
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
