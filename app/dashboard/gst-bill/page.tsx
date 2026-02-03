"use client"
import * as React from "react"
import useSWR, { SWRConfiguration } from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { InvoicePreview, type Item as PreviewItem, type Taxes as PreviewTaxes } from "@/components/invoice-preview"
import { PdfExportButton } from "@/components/pdf-export"
import { useGstBillStore } from "@/hooks/use-gst-bill-store"
import { useMemo, useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

export const runtime = 'edge';

type Product = { id: string; name: string; price?: number }
type ClientDetails = { id: string; name: string; gst?: string; fssai?: string; address?: string; phone?: string; email?: string }
type Bank = { bankName?: string; accountNo?: string; pan?: string; branchIfsc?: string }
type Company = { name?: string; gst?: string;fssai?: string; address?: string; phone?: string; email?: string }


type TaxInputs = {
  cgst: string
  sgst: string  
  igst: string
}
// Explicitly type the fetcher to return Promise<Product[]>
const fetcher = async (url: string): Promise<any> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch ${url}`)
  return response.json()
}

const PRODUCT_OVERRIDES_KEY = "listofprodutes_overrides"
const BANK_OVERRIDES_KEY = "bankdetails_overrides"
const COMPANY_OVERRIDES_KEY = "companydetails_overrides"

function normalizeBank(raw: any): Bank {
  if (!raw) return {}
  return {
    bankName: raw.bankName ?? raw.bank_name ?? raw.bank ?? "",
    accountNo: raw.accountNo ?? raw.account_number ?? raw.accountNumber ?? "",
    pan: raw.pan ?? raw.companyPan ?? "",
    branchIfsc:
      raw.branchIfsc ??
      raw.branch_ifsc ??
      [raw.branch, raw.ifsc]
        .filter((x) => typeof x === "string" && x.trim().length > 0)
        .join(" ")
        .trim() ??
      "",
  }
}

function normalizeCompany(raw: any): Company {
  if (!raw) return {}
  return {
    name: raw.name ?? "",
    gst: raw.gst ?? "",
    fssai: raw.fssai ?? "",
    address: raw.address ?? "",
    phone: raw.phone ?? "",
    email: raw.email ?? "",
  }
}

function formatToDDMMYYYY(isoDate: string): string {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return "";
  return format(date, "dd-MM-yyyy");
}

function parseToISO(dateStr: string): string | null {
  if (!dateStr) return null;
  // Try parsing as DD-MM-YYYY
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime()) && date.getDate() === day && date.getMonth() === month - 1) {
      return date.toISOString().split("T")[0];
    }
  }
  // Fallback to direct Date parsing
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }
  return null;
}

interface DatePickerProps {
  date: string
  onDateChange: (date: string) => void
  placeholder?: string
}

function DatePicker({ date, onDateChange, placeholder }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? formatToDDMMYYYY(date) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date ? new Date(date) : undefined}
          onSelect={(selectedDate) => {
            if (!selectedDate) {
              onDateChange("");
              setOpen(false);
              return;
            }
            // Use local date components to avoid timezone shift
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
            const day = String(selectedDate.getDate()).padStart(2, "0");
            const isoDate = `${year}-${month}-${day}`;
            onDateChange(isoDate);
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

// Polyfill for crypto.randomUUID() for compatibility
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator using Math.random
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function GstBillPage() {
  const { data: baseProducts } = useSWR<Product[], Error>("/listofprodutes.json", fetcher)
  const [productOverrides, setProductOverrides] = React.useState<Product[] | null>(null)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(PRODUCT_OVERRIDES_KEY)
      if (raw) setProductOverrides(JSON.parse(raw))
    } catch {}
  }, [])
  const products: Product[] = useMemo(() => {
    const map = new Map<string, Product>()
    ;(baseProducts ?? []).forEach((p) => map.set(p.id, p))
    ;(productOverrides ?? []).forEach((p) => map.set(p.id, p))
    return Array.from(map.values())
  }, [baseProducts, productOverrides])

  const { data: clients } = useSWR<ClientDetails[], Error>("/ClientDetails.json", fetcher)

  const { data: bankBaseRaw } = useSWR("/bankdetails.json", fetcher)
  const baseBank = useMemo(() => normalizeBank(bankBaseRaw), [bankBaseRaw])
  const [bankOverride, setBankOverride] = React.useState<Bank | null>(null)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(BANK_OVERRIDES_KEY)
      if (raw) setBankOverride(JSON.parse(raw))
    } catch {}
  }, [])
  const bank: Bank = bankOverride ?? baseBank ?? {}

  const { data: companyBaseRaw } = useSWR("/api/company", fetcher)
  const baseCompany = useMemo(() => normalizeCompany(companyBaseRaw), [companyBaseRaw])
  const [companyOverride, setCompanyOverride] = React.useState<Company | null>(null)
  const [isEditingCompany, setIsEditingCompany] = React.useState(false)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(COMPANY_OVERRIDES_KEY)
      if (raw) setCompanyOverride(JSON.parse(raw))
    } catch {}
  }, [])
  const savedCompany: Company = companyOverride ?? baseCompany ?? {}

  const { toast } = useToast()

  const {
    company,
    client,
    invoice,
    taxes,
    watermark,
    items,
    setCompany,
    setClient,
    setInvoice,
    setTaxes,
    setWatermark,
    setItems,
    reset,
  } = useGstBillStore()

  // Sync company details with store on mount or when savedCompany changes
  React.useEffect(() => {
    setCompany(savedCompany)
  }, [savedCompany, setCompany])

  // Local state to handle tax inputs as strings
const [taxInputs, setTaxInputs] = useState<TaxInputs>({
  cgst: taxes.cgst !== undefined ? taxes.cgst.toString() : "2.5",
  sgst: taxes.sgst !== undefined ? taxes.sgst.toString() : "2.5",
  igst: taxes.igst !== undefined ? taxes.igst.toString() : "",
})



  // Sync local state with store when taxes change
  // React.useEffect(() => {
  //   setTaxInputs({
  //     cgst: taxes.cgst !== undefined ? taxes.cgst.toString() : "2.5",
  //     sgst: taxes.sgst !== undefined ? taxes.sgst.toString() : "2.5",
  //     igst: taxes.igst !== undefined ? taxes.igst.toString() : "",
  //   })
  // }, [taxes])

  // Handle tax input changes
const handleTaxChange = (field: keyof PreviewTaxes, value: string) => {
  const nextInputs = { ...taxInputs, [field]: value }
  setTaxInputs(nextInputs)
  
  const nextTaxes: Partial<PreviewTaxes> = {
    ...taxes,
    [field]: value === "" ? undefined : parseFloat(value) || undefined,
  }
  setTaxes(nextTaxes)
}

// 5. IGST handler with CGST/SGST reset logic (direct call, not function)
const handleIgstChange = (value: string) => {
  const igstNum = parseFloat(value)
  const isValidIgst = value !== "" && !isNaN(igstNum)
  
  // Update inputs - reset CGST/SGST if IGST is valid
  setTaxInputs({
    ...taxInputs,
    igst: value,
    ...(isValidIgst && { cgst: "0", sgst: "0" })
  })
  
  // Update store taxes - direct object, not function
  setTaxes({
    ...taxes,
    igst: isValidIgst ? igstNum : undefined,
    ...(isValidIgst && { cgst: 0, sgst: 0 })
  })
}

  // Handle company details save
  const handleSaveCompany = async () => {
    try {
      const response = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(company),
      })
      if (response.ok) {
        setCompanyOverride(company)
        localStorage.setItem(COMPANY_OVERRIDES_KEY, JSON.stringify(company))
        setIsEditingCompany(false)
        toast({ title: "Company details saved successfully" })
      } else {
        throw new Error("Failed to save company details")
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to save company details", variant: "destructive" })
    }
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setCompany(savedCompany)
    setIsEditingCompany(false)
  }

  function addItem() {
    setItems((prev:any) => [...prev, { id: generateUUID(), name: "", rate: 0, qty: 1, amount: 0, hsn: "" }])
  }
  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }
  function setItemField(id: string, field: keyof PreviewItem, value: any) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i
        const next = { ...i, [field]: value }
        if (field !== "hsn") {
          const qty = Number(next.qty || 0)
          const rate = Number(next.rate || 0)
          next.amount = +(qty * rate).toFixed(2)
        }
        return next
      }),
    )
  }
function chooseProductById(itemId: string, productId: string) {
  const p = products.find((x) => x.id === productId)
  if (!p) return
  setItems((prev) =>
    prev.map((i:any) =>
      i.id === itemId
        ? {
            ...i,
            name: p.name,
            rate: Number(p.price ?? 0), // ✅ keep as number
            amount: +(i.qty * Number(p.price ?? 0)).toFixed(2), // ✅ stays number
          }
        : i
    )
  )
}

  const previewTaxes: PreviewTaxes = useMemo(
    () => ({
      cgst: taxInputs.cgst === "" ? undefined : parseFloat(taxInputs.cgst),
      sgst: taxInputs.sgst === "" ? undefined : parseFloat(taxInputs.sgst),
      igst: taxInputs.igst === "" ? undefined : parseFloat(taxInputs.igst),
      notes: taxes.notes || "Goods once sold cannot be taken back",
    }),
    [taxInputs, taxes.notes],
  )

  // Client picker states for inline suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Update filteredClients useMemo to depend on client.name and limit to first 3
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    const matches = clients.filter((c) =>
      c.name.toLowerCase().includes(client.name.toLowerCase())
    );
    return matches.slice(0, 3);
  }, [clients, client.name]);

  const handleSelectClient = (c: ClientDetails) => {
    // Ensure all fields are updated by creating a complete client object from selected client
    const updatedClient = {
      name: c.name,
      gst: c.gst ?? "",
      fssai: c.fssai ?? "",
      address: c.address ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
    };
    setClient(updatedClient);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold">GST Bill Generate</h1>

      {/* Company Details */}
      <section className="bg-white border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Company Details</h2>
          {!isEditingCompany ? (
            <Button size="sm" onClick={() => setIsEditingCompany(true)}>
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveCompany}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          )}
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label>Company name</Label>
            <Input
              value={company.name ?? ""}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
              disabled={!isEditingCompany}
            />
          </div>
          <div className="space-y-1">
            <Label>GST number</Label>
            <Input
              value={company.gst ?? ""}
              onChange={(e) => setCompany({ ...company, gst: e.target.value })}
              disabled={!isEditingCompany}
            />
          </div>
          <div className="space-y-1">
            <Label>FSSAI No</Label>
            <Input
              value={company.fssai ?? ""}
              onChange={(e) => setCompany({ ...company, fssai: e.target.value })}
              disabled={!isEditingCompany}
            />
          </div>
          <div className="space-y-1 md:col-span-3">
            <Label>Address</Label>
            <Input
              value={company.address ?? ""}
              onChange={(e) => setCompany({ ...company, address: e.target.value })}
              disabled={!isEditingCompany}
            />
          </div>
          <div className="space-y-1">
            <Label>Phone number</Label>
            <Input
              value={company.phone ?? ""}
              onChange={(e) => setCompany({ ...company, phone: e.target.value })}
              disabled={!isEditingCompany}
            />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              value={company.email ?? ""}
              onChange={(e) => setCompany({ ...company, email: e.target.value })}
              disabled={!isEditingCompany}
            />
          </div>
        </div>
      </section>

      {/* Client Details - Updated Section */}
      <section className="bg-white border rounded-lg p-4 space-y-3">
        <h2 className="font-medium">Client Details</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="space-y-1 relative">
            <Label>Client name</Label>
            <Input 
              value={client.name} 
              onChange={(e) => setClient({ ...client, name: e.target.value })} 
              placeholder="Enter or select client name"
              onFocus={() => setShowSuggestions(true)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setTimeout(() => setShowSuggestions(false), 200);
                }
              }}
            />
            {showSuggestions && client.name.length > 0 && filteredClients.length > 0 && (
              <div className="absolute z-50 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                <ul className="p-0 m-0 divide-y divide-border">
                  {filteredClients.map((c) => (
                    <li
                      key={c.id}
                      className="p-3 cursor-pointer hover:bg-accent flex items-center justify-between"
                      onMouseDown={() => handleSelectClient(c)} // Use onMouseDown to prevent blur
                    >
                      <span className="text-sm font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground">Select</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!clients ? (
              <div className="text-xs text-muted-foreground mt-1">Loading clients...</div>
            ) : filteredClients.length === 0 && client.name.length > 0 ? (
              <div className="text-xs text-muted-foreground mt-1">No matching clients found.</div>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label>Client GST number</Label>
            <Input value={client.gst || ""} onChange={(e) => setClient({ ...client, gst: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Client FSSAI number</Label>
            <Input value={client.fssai || ""} onChange={(e) => setClient({ ...client, fssai: e.target.value })} />
          </div>
          <div className="space-y-1 md:col-span-3">
            <Label>Client address</Label>
            <Input value={client.address || ""} onChange={(e) => setClient({ ...client, address: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Client phone</Label>
            <Input value={client.phone || ""} onChange={(e) => setClient({ ...client, phone: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Client email (optional)</Label>
            <Input value={client.email || ""} onChange={(e) => setClient({ ...client, email: e.target.value })} />
          </div>
        </div>
      </section>

      {/* Invoice Details */}
      <section className="bg-white border rounded-lg p-4 space-y-3">
        <h2 className="font-medium">Invoice Details</h2>
        <div className="grid md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label>Invoice number</Label>
            <Input value={invoice.number} onChange={(e) => setInvoice({ ...invoice, number: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Place/Location</Label>
            <Input value={invoice.place} onChange={(e) => setInvoice({ ...invoice, place: e.target.value })} />
          </div>
         
<div className="space-y-1">
  <Label>Invoice date</Label>
  <DatePicker
    date={invoice.date} // expects string
    onDateChange={(isoDate: string) => {
      setInvoice({ ...invoice, date: isoDate });
    }}
    placeholder="Pick a date"
  />
</div>
          <div className="space-y-1">
            <Label>Due date</Label>
            <DatePicker
              date={invoice.due}
                  onDateChange={(isoDate: string) => {
      setInvoice({ ...invoice, due: isoDate });
    }}
              placeholder="Pick a date"
            />
          </div>
        </div>
      </section>

      {/* Items */}
      <section className="bg-white border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Items</h2>
          <Button size="sm" onClick={addItem}>
            Add item
          </Button>
        </div>
        <div className="space-y-3">
          {items.map((it) => {
            const currentProductId = products.find((p) => p.name === it.name)?.id ?? ""
            return (
              <div key={it.id} className="grid gap-3 md:grid-cols-[2fr,1fr,1fr,1fr,1fr,auto]">
                <div className="space-y-1">
                  <Label>Product</Label>
                  <select
                    className="h-9 w-full rounded-md border px-2 text-sm"
                    value={currentProductId}
                    onChange={(e) => chooseProductById(it.id, e.target.value)}
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>HSN/SAC</Label>
                  <Input value={it.hsn || ""} onChange={(e) => setItemField(it.id, "hsn", e.target.value)} />
                </div>
              <div className="space-y-1">
  <Label>Quantity</Label>
  <Input
    type="number"
    step="any"
    value={it.qty}
    onChange={(e) =>
      setItemField(it.id, "qty", parseFloat(e.target.value) || 0)
    }
  />
</div>

                <div className="space-y-1">
                  <Label>Rate</Label>
                  <Input value={it.rate} readOnly />
                </div>
                <div className="space-y-1">
                  <Label>Amount</Label>
                  <Input value={it.amount} readOnly />
                </div>
                <div className="flex items-end">
                  <Button variant="destructive" size="sm" onClick={() => removeItem(it.id)} aria-label="Remove item">
                    X
                  </Button>
                </div>
              </div>
            )
          })}
          {items.length === 0 && (
            <div className="text-sm text-gray-500">
              Add items from your product list. Rates auto-fill; amount = qty × rate.
            </div>
          )}
        </div>
      </section>

      {/* Taxes and Notes */}
   <section className="bg-white border rounded-lg p-4 space-y-3">
  <h2 className="font-medium">Tax Details</h2>
  <div className="grid md:grid-cols-4 gap-3">
    <div className="space-y-1">
      <Label>CGST rate (%)</Label>
  <Input
    type="number"
    step="0.01"
    min="0"
    value={taxInputs.cgst}
    onChange={(e) => handleTaxChange("cgst", e.target.value)}
  />
    </div>
    <div className="space-y-1">
      <Label>SGST rate (%)</Label>
  <Input
    type="number"
    step="0.01"
    min="0"
    value={taxInputs.sgst}
    onChange={(e) => handleTaxChange("sgst", e.target.value)}
  />
    </div>
    <div className="space-y-1">
      <Label>IGST rate (%)</Label>
    <Input
    type="number"
    step="0.01"
    min="0"
    value={taxInputs.igst}
    onChange={(e) => handleIgstChange(e.target.value)}
  />
    </div>
    <div className="space-y-1 md:col-span-4">
      <Label>Additional notes</Label>
      <Textarea value={taxes.notes || "Goods once sold cannot be taken back"} onChange={(e) => setTaxes({ ...taxes, notes: e.target.value })} />
    </div>
  </div>
</section>

      {/* Watermark */}
      <section className="bg-white border rounded-lg p-4 space-y-3">
        <h2 className="font-medium">Watermark</h2>
        <div className="grid md:grid-cols-[1fr,auto] gap-3 items-end">
          <div className="space-y-1">
            <Label>Watermark text</Label>
            <Input value={watermark.text} onChange={(e) => setWatermark({ ...watermark, text: e.target.value })} placeholder="" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={watermark.enabled ? "default" : "outline"}
              onClick={() => setWatermark({ ...watermark, enabled: !watermark.enabled })}
            >
              {watermark.enabled ? "Applied" : "Apply"}
            </Button>
          </div>
        </div>
      </section>

      <div className="flex gap-3">
        <Button onClick={() => toast({ title: "Preview updated" })}>Preview</Button>
        <PdfExportButton />
        <Button variant="outline" onClick={reset}>
          Clear
        </Button>
      </div>

      {/* Preview */}
      <section className="bg-gray-100 p-4 rounded-lg">
        <InvoicePreview
          items={items}
          parties={{ company, client }}
          invoice={invoice}
          taxes={previewTaxes}
          bank={bank}
          watermark={watermark}
        />
      </section>
    </div>
  )
}