import { numberToIndianCurrencySentence } from "@/lib/currency"
import type React from "react"

export type Item = { id: string; name: string; rate: number; qty: number; amount: number; hsn?: string }
export type Parties = {
  company: { name?: string; gst?: string; address?: string; phone?: string; email?: string; fssai?: string }
  client: { name?: string; gst?: string; address?: string; phone?: string; email?: string }
}
export type InvoiceMeta = { number?: string; place?: string; date?: string; due?: string }
export type Taxes = { cgst?: number; sgst?: number; igst?: number; notes?: string }
export type Bank = { bankName?: string; accountNo?: string; pan?: string; branchIfsc?: string }
export type Watermark = { text?: string; enabled?: boolean }

function Row({ left, right }: { left: string | React.ReactNode; right?: string | React.ReactNode }) {
  return (
    <div className="flex justify-between text-xs">
      <div>{left}</div>
      <div className="text-right">{right}</div>
    </div>
  )
}

export function InvoicePreview({
  items,
  parties,
  invoice,
  taxes,
  bank,
  watermark,
}: {
  items: Item[]
  parties: Parties
  invoice: InvoiceMeta
  taxes: Taxes
  bank?: Bank
  watermark?: Watermark
}) {
  const taxable = items.reduce((s, i) => s + i.amount, 0)
  const cgst = ((taxes.cgst || 0) * taxable) / 100
  const sgst = ((taxes.sgst || 0) * taxable) / 100
  const igst = ((taxes.igst || 0) * taxable) / 100
  const taxTotal = +(cgst + sgst + igst).toFixed(2)
  const grand = +(taxable + taxTotal).toFixed(2)


  function formatDate(dateString?: string) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }


  return (
    <div
      id="invoice-a4"
      className="invoice-a4 relative mx-auto"
      style={
        {
          color: "#111827",
          backgroundColor: "#ffffff",
          ["--border"]: "#e5e7eb",
          ["--ring"]: "#93c5fd",
          ["--foreground"]: "#111827",
          ["--background"]: "#ffffff",
        } as React.CSSProperties
      }
    >
      {watermark?.enabled && watermark?.text && (
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-0 flex items-center justify-center"
          style={{ overflow: "hidden", zIndex: 1 }}
        >
          <div
            className="uppercase font-extrabold text-5xl"
            style={{
              transform: "rotate(-35deg)",
              letterSpacing: "0.3em",
              color: "rgba(0,0,0,0.06)",
              userSelect: "none",
              whiteSpace: "nowrap",
            }}
          >
            {watermark.text}
          </div>
        </div>
      )}

      <div className="border-b pb-2">
        <div className="text-center font-semibold"></div>
        <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <div className="font-medium">
              <p className="font-semibold !text-[30px]" style={{ fontFamily: "Poppins, sans-serif" }}>{parties.company.name || "Company Name"}</p>
            </div>
            <div>
              <p className="font-semibold text-[14px]">{parties.company.address}</p>
            </div>
            <div className="flex items-center gap-1">
              <p className="font-semibold text-[14px]">FSSAI No :</p>
              <p className="text-[14px]">{parties.company.fssai}</p>
            </div>
            <div className="flex items-center gap-1">
              <p className="font-semibold text-[14px]">GSTIN :</p>
              <p className="text-[14px]">{parties.company.gst}</p>
            </div>
            <div className="flex items-center gap-1">
              <p className="font-semibold text-[14px]">Phone :</p>
              <p className="text-[14px]">{parties.company.phone}</p>
            </div>
            <div className="flex items-center gap-1">
              <p className="font-semibold text-[14px]">Email :</p>
              <p className="text-[14px]">{parties.company.email}</p>
            </div>
          </div>
          <div className="flex  space-x-2 mt-8">
            <div className="grid grid-cols-1 h-fit gap-y-1 gap-x-6">
              <div className="flex items-center gap-1">
                <p className="font-semibold text-[14px]">Invoice No </p>

              </div>
              <div className="flex items-center gap-1">
                <p className="font-semibold text-[14px]">Place </p>
                {/* <p>{invoice.place}</p> */}
              </div>
              <div className="flex items-center gap-1">
                <p className="font-semibold text-[14px]">Invoice Date </p>
                {/* <p className="text-[14px]">{invoice.date}</p> */}
              </div>
              <div className="flex items-center gap-1">
                <p className="font-semibold text-[14px]">Due Date </p>
                {/* <p className="text-[14px]">{invoice.due}</p> */}
              </div>
            </div>
            <div className="grid grid-cols-1 h-fit gap-y-1 gap-x-6">
              <div className="flex items-center gap-1">
                {/* <p className="font-semibold">Invoice No:</p> */}
                <p className="text-[14px]">: {invoice.number}</p>
              </div>
              <div className="flex items-center gap-1">
                {/* <p className="font-semibold">Place :</p> */}
                <p className="text-[14px]">: {invoice.place}</p>
              </div>
              <div className="flex items-center gap-1">
                {/* <p className="font-semibold">Invoice Date :</p> */}
                <p className="text-[14px]">: {formatDate(invoice.date)}</p>
              </div>
              <div className="flex items-center gap-1">
                {/* <p className="font-semibold">Due Date :</p> */}
                <p className="text-[14px]">: {formatDate(invoice.due)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-b py-2 text-xs">
        <div>
          <div className="font-semibold text-[14px]">Client Details</div>
          <div className="space-y-1 mt-1">
            <div className="font-medium">
              <p className="font-semibold text-[16px]">{parties.client.name}</p>
            </div>
            <div className="flex items-center gap-1">
              <p className="font-semibold text-[14px]">GSTIN :</p>
              <p className="text-[14px]">{parties.client.gst}</p>
            </div>
            <div className="flex items-center gap-1">
              <p className="font-semibold text-[14px]">Phone :</p>
              <p className="text-[14px]">{parties.client.phone}</p>
            </div>
            {parties.client.email && (
              <div className="flex items-center gap-1">
                <p className="font-semibold text-[14px]">Email :</p>
                <p className="text-[14px]">{parties.client.email}</p>
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="font-semibold text-[14px]">Client Address</div>
          <div className="flex items-start gap-1 mt-2">
            <p className="font-semibold text-[14px]">Address:</p>
            <p className="text-[14px]">{parties.client.address}</p>
          </div>
        </div>
      </div>

      <div className="mt-2 h-[300px]">
        <p className="font-semibold text-[14px]">Notes :</p>
        <table className="w-full border text-xs h-full ">
          <thead>
            <tr className="bg-[#f3f4f6]">
              <th className="border border-2 border-black px-2 py-1 text-left text-[14px]">Sl</th>
              <th className="border border-2 border-black px-2 py-1 text-left text-[14px]">Description of Goods</th>
              <th className="border border-2 border-black px-2 py-1 text-[14px]">HSN/SAC</th>
              <th className="border border-2 border-black px-2 py-1 text-[14px]">Qty</th>
              <th className="border border-2 border-black px-2 py-1 text-[14px]">Rate <br /> <span className="text-gray-500 text-[13px]">(Per Kg) </span> </th>
              <th className="border border-2 border-black px-2 py-1 text-[14px]">Amount</th>
            </tr>
          </thead>
          <tbody className="">
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="border border-2 border-black px-2 py-6 text-center text-[#9ca3af] text-[14px]">
                  No items
                </td>
              </tr>
            )}
            {items.map((it, idx) => (
              <tr key={it.id} className="">
                <td className="border  border-2 border-black px-2 py-1 text-[14px] ">{idx + 1}</td>
                <td className="border  border-2 border-black px-2 py-1 text-[14px]">{it.name}</td>
                <td className="border  border-2 border-black px-2 py-1 text-center text-[14px]">{it.hsn || ""}</td>
                <td className="border  border-2 border-black px-2 py-1 text-center text-[14px]">{it.qty}</td>
                <td className="border  border-2 border-black px-2 py-1 text-right text-[14px]">{Number(it.rate ?? 0).toFixed(2)}</td>
                <td className="border  border-2 border-black px-2 py-1 text-right text-[14px]">{Number(it.amount ?? 0).toFixed(2)}</td>
              </tr>
            ))}
            {items.map((it, idx) => (
              <tr key={it.id} className="invisible">
                <td className="">{idx + 1}</td>
                <td className="">{it.name}</td>
                <td className="">{it.hsn || ""}</td>
                <td className="">{it.qty}</td>
                <td className="">{Number(it.rate ?? 0).toFixed(2)}</td>
                <td className="">{Number(it.amount ?? 0).toFixed(2)}</td>
              </tr>
            ))}
            
          </tbody>
          <tfoot>
            <tr>
              <td className="border  border-2 border-black px-2 py-1 text-right font-medium text-[14px]" colSpan={5}>
                Total
              </td>
              <td className="border  border-2 border-black px-2 py-1 text-right font-medium text-[14px]">{taxable.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-3.mt-2 text-xs !mt-6">
        <div>
          {taxes.notes && (
            <>
              
              <div className="mt-10">
                <span className="font-semibold break-words whitespace-pre-wrap text-[14px]">Tax Amount (in words):{" "}</span><br />
                {numberToIndianCurrencySentence(grand)}
              </div>
            </>
          )}
        </div>
        <div className="border p-2 space-y-1 text-[14px]">
          {taxes.cgst ? <Row left={`CGST ${taxes.cgst}%`} right={cgst.toFixed(2)} /> : null}
          {taxes.sgst ? <Row left={`SGST ${taxes.sgst}%`} right={sgst.toFixed(2)} /> : null}
          {taxes.igst ? <Row left={`IGST ${taxes.igst}%`} right={igst.toFixed(2)} /> : null}
          {/* <Row
            left={<span className="font-medium">Tax Total</span>}
            right={<span className="font-medium">{taxTotal.toFixed(2)}</span>}
          /> */}
          <hr className="border-t-1 border-gray-400" />
          <Row
            left={<span className="font-semibold text-[14px]">Grand Total</span>}
            right={<span className="font-semibold text-[14px]">  {Math.round(grand)}</span>}
          />
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
        <div className="border p-2">
          <div className="font-semibold text-[14px] mb-1 text-[14px]">Notes</div>
          <div className="min-h-[48px] break-words whitespace-pre-wrap text-[14px]">
            {taxes.notes}
          </div>
        </div>
        <div>
          <div className="border p-2 space-y-1">
            <div className="font-semibold text-[14px] mb-2 text-[14px]">Company's Bank Details</div>
            <div>
              <span className="font-semibold text-[14px]">Bank Name: </span>
              <span className="ml-1 text-[14px]">{bank?.bankName}</span>
            </div>
            <div>
              <span className="font-semibold text-[14px]">A/c No: </span>
              <span className="ml-1 text-[14px]">{bank?.accountNo}</span>
            </div>
            <div>
              <span className="font-semibold text-[14px]">Company's PAN: </span>
              <span className="ml-1 text-[14px]">{bank?.pan}</span>
            </div>
            <div>
              <span className="font-semibold text-[14px]">Branch & IFSC: </span>
              <span className="ml-1 text-[14px]">{bank?.branchIfsc}</span>
            </div>


          </div>

          {/* <div className="mt-5">
            <p className="text-[15px] ">
              For Namma Tea World</p>
          </div> */}

        </div>

      </div>



      <div className="mt-6 flex justify-end">
        <div className="w-56 text-center p-2 text-xs">
          <div className="h-12" />
          <div className="font-medium text-[14px]">Authorised Signatory</div>
        </div>
      </div>
    </div>
  )
}