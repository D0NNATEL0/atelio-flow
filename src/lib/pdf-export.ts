import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import JSZip from "jszip";

type ExportAccount = {
  companyName: string;
  companyAddress: string;
  companyMeta: string;
  logoUrl?: string;
};

type ExportDocument = {
  id: string;
  client: string;
  date: string;
  due: string;
  amount: string;
  status: string;
  type: string;
};

function sanitizeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-");
}

function createPdfDocumentFromCanvas(canvas: HTMLCanvasElement) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;
  const pxPerMm = canvas.width / usableWidth;
  const pageHeightPx = Math.floor(usableHeight * pxPerMm);

  let offsetY = 0;
  let pageIndex = 0;

  while (offsetY < canvas.height) {
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = Math.min(pageHeightPx, canvas.height - offsetY);

    const sliceContext = sliceCanvas.getContext("2d");
    if (!sliceContext) throw new Error("Impossible de préparer la page PDF.");

    sliceContext.drawImage(
      canvas,
      0,
      offsetY,
      canvas.width,
      sliceCanvas.height,
      0,
      0,
      canvas.width,
      sliceCanvas.height
    );

    if (pageIndex > 0) {
      pdf.addPage();
    }

    const imageData = sliceCanvas.toDataURL("image/png");
    const imageHeight = (sliceCanvas.height * usableWidth) / sliceCanvas.width;
    pdf.addImage(imageData, "PNG", margin, margin, usableWidth, imageHeight, undefined, "FAST");

    offsetY += sliceCanvas.height;
    pageIndex += 1;
  }

  return pdf;
}

async function renderElementToPdfBlob(element: HTMLElement) {
  await waitForExportFrame(element);

  const canvas = await html2canvas(element, {
    scale: Math.max(2, window.devicePixelRatio || 1),
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: element.scrollWidth || element.clientWidth || 794,
    windowHeight: element.scrollHeight || element.clientHeight || 1123
  });

  const pdf = createPdfDocumentFromCanvas(canvas);
  return pdf.output("blob");
}

async function waitForExportFrame(element: HTMLElement) {
  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

  const images = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        })
    )
  );
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function createExportMarkup(document: ExportDocument, account: ExportAccount) {
  const isContractFamily = document.type === "Contrat" || document.type === "Avenant";

  return `
    <style>
      .atelio-export-page {
        width: 794px;
        padding: 40px;
        border-radius: 24px;
        background: #ffffff;
        color: #241f1a;
        font-family: Arial, sans-serif;
      }
      .atelio-export-head {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        align-items: flex-start;
        margin-bottom: 28px;
      }
      .atelio-export-brand-block {
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }
      .atelio-export-brand-logo {
        width: 64px;
        height: 64px;
        object-fit: contain;
        border-radius: 18px;
        border: 1px solid #eee3d8;
        background: #fff;
        padding: 8px;
      }
      .atelio-export-brand {
        font-size: 28px;
        font-weight: 800;
        color: #e48b2f;
        margin-bottom: 10px;
      }
      .atelio-export-muted {
        color: #6f665c;
        line-height: 1.55;
      }
      .atelio-export-badge {
        display: inline-flex;
        padding: 10px 16px;
        border-radius: 999px;
        background: #fff2e6;
        color: #d97613;
        font-weight: 700;
      }
      .atelio-export-meta {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        overflow: hidden;
        border: 1px solid #eee3d8;
        border-radius: 18px;
        margin-bottom: 28px;
      }
      .atelio-export-meta > div {
        padding: 18px;
        border-right: 1px solid #eee3d8;
      }
      .atelio-export-meta > div:last-child {
        border-right: none;
      }
      .atelio-export-label {
        display: block;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .08em;
        color: #85796f;
        margin-bottom: 6px;
      }
      .atelio-export-value {
        font-size: 16px;
        font-weight: 700;
      }
      .atelio-export-parties {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 24px;
        margin-bottom: 28px;
      }
      .atelio-export-section-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .08em;
        color: #85796f;
        margin-bottom: 8px;
      }
      .atelio-export-party-name {
        font-size: 24px;
        font-weight: 800;
        margin-bottom: 8px;
      }
      .atelio-export-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 28px;
      }
      .atelio-export-table th {
        text-align: left;
        padding: 14px 18px;
        background: #e48b2f;
        color: white;
        font-size: 14px;
      }
      .atelio-export-table td {
        padding: 16px 18px;
        border-bottom: 1px solid #eee3d8;
      }
      .atelio-export-totals {
        width: 320px;
        margin-left: auto;
        display: grid;
        gap: 8px;
      }
      .atelio-export-totals-row {
        display: flex;
        justify-content: space-between;
        gap: 16px;
      }
      .atelio-export-total-final {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 14px 18px;
        border-radius: 16px;
        background: #e48b2f;
        color: white;
        font-weight: 800;
      }
      .atelio-export-contract-block {
        display: grid;
        gap: 20px;
      }
      .atelio-export-contract-card {
        padding: 18px 20px;
        border: 1px solid #eee3d8;
        border-radius: 18px;
        background: #fffdfa;
      }
      .atelio-export-footer {
        margin-top: 28px;
        padding-top: 18px;
        border-top: 1px solid #eee3d8;
        color: #85796f;
      }
    </style>
    <div class="atelio-export-page">
      <div class="atelio-export-head">
        <div class="atelio-export-brand-block">
          ${account.logoUrl ? `<img alt="Logo entreprise" class="atelio-export-brand-logo" src="${account.logoUrl}" />` : ""}
          <div>
            <div class="atelio-export-brand">${account.companyName}</div>
            <div class="atelio-export-muted">${account.companyAddress}<br />${account.companyMeta}</div>
          </div>
        </div>
        <div>
          <div class="atelio-export-badge">${document.type}</div>
          <div class="atelio-export-muted" style="margin-top:12px">${document.id}</div>
        </div>
      </div>

      <div class="atelio-export-meta">
        <div>
          <span class="atelio-export-label">Date</span>
          <span class="atelio-export-value">${document.date}</span>
        </div>
        <div>
          <span class="atelio-export-label">${isContractFamily ? "Date de fin" : "Échéance"}</span>
          <span class="atelio-export-value">${document.due}</span>
        </div>
        <div>
          <span class="atelio-export-label">Statut</span>
          <span class="atelio-export-value">${document.status}</span>
        </div>
      </div>

      <div class="atelio-export-parties">
        <div>
          <div class="atelio-export-section-title">Émetteur</div>
          <div class="atelio-export-party-name">${account.companyName}</div>
          <div class="atelio-export-muted">${account.companyAddress}<br />${account.companyMeta}</div>
        </div>
        <div>
          <div class="atelio-export-section-title">Client</div>
          <div class="atelio-export-party-name">${document.client}</div>
        </div>
      </div>

      ${
        isContractFamily
          ? `
            <div class="atelio-export-contract-block">
              <div class="atelio-export-contract-card">
                <div class="atelio-export-section-title">Objet</div>
                <div class="atelio-export-muted">Document contractuel lié à la collaboration en cours avec ${document.client}.</div>
              </div>
              <div class="atelio-export-contract-card">
                <div class="atelio-export-section-title">Cadre</div>
                <div class="atelio-export-muted">Les modalités commerciales, livrables et échéances sont confirmés selon le document ${document.id}.</div>
              </div>
            </div>
          `
          : `
            <table class="atelio-export-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qté</th>
                  <th>P.U. HT</th>
                  <th>Total HT</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Prestation principale</td>
                  <td>1</td>
                  <td>${document.amount}</td>
                  <td>${document.amount}</td>
                </tr>
              </tbody>
            </table>
            <div class="atelio-export-totals">
              <div class="atelio-export-totals-row"><span>Sous-total HT</span><strong>${document.amount}</strong></div>
              <div class="atelio-export-totals-row"><span>TVA</span><strong>Incluse selon configuration</strong></div>
              <div class="atelio-export-total-final"><span>Total TTC</span><span>${document.amount}</span></div>
            </div>
          `
      }

      <div class="atelio-export-footer">Document exporté depuis Atelio Flow.</div>
    </div>
  `;
}

function createTemporaryExportNode(markup: string) {
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "0";
  wrapper.style.top = "0";
  wrapper.style.width = "820px";
  wrapper.style.padding = "0";
  wrapper.style.opacity = "0.01";
  wrapper.style.zIndex = "-1";
  wrapper.style.pointerEvents = "none";
  wrapper.style.background = "#ffffff";
  wrapper.innerHTML = markup;
  document.body.appendChild(wrapper);
  return wrapper;
}

export async function downloadElementAsPdf(element: HTMLElement, fileName: string) {
  const blob = await renderElementToPdfBlob(element);
  downloadBlob(blob, sanitizeFileName(fileName));
}

export async function downloadDocumentAsPdf(document: ExportDocument, account: ExportAccount) {
  const wrapper = createTemporaryExportNode(createExportMarkup(document, account));
  try {
    const blob = await renderElementToPdfBlob(wrapper.firstElementChild as HTMLElement);
    downloadBlob(blob, `${sanitizeFileName(document.id)}.pdf`);
  } finally {
    wrapper.remove();
  }
}

export async function downloadDocumentsAsZip(documents: ExportDocument[], account: ExportAccount, zipName: string) {
  const zip = new JSZip();

  for (const document of documents) {
    const wrapper = createTemporaryExportNode(createExportMarkup(document, account));
    try {
      const blob = await renderElementToPdfBlob(wrapper.firstElementChild as HTMLElement);
      zip.file(`${sanitizeFileName(document.id)}.pdf`, blob);
    } finally {
      wrapper.remove();
    }
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  downloadBlob(zipBlob, `${sanitizeFileName(zipName)}.zip`);
}
