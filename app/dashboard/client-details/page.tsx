"use client"
import * as React from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Search, Plus, Edit, Trash2, X } from "lucide-react"

type ClientDetails = {
  id: string
  name: string
  gst?: any
  fssai?: string
  address?: any
  phone?: any
  email?: string
}

const fetcher = async (url: string): Promise<ClientDetails[]> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch ${url}`)
  return response.json()
}

async function createClient(data: Omit<ClientDetails, "id">): Promise<ClientDetails> {
  const response = await fetch("/api/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error("Failed to create client")
  return response.json()
}

async function updateClient(id: string, data: Partial<ClientDetails>): Promise<ClientDetails> {
  const response = await fetch(`/api/clients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error("Failed to update client")
  return response.json()
}

async function deleteClient(id: string): Promise<void> {
  const response = await fetch(`/api/clients/${id}`, { method: "DELETE" })
  if (!response.ok) throw new Error("Failed to delete client")
}

export default function ClientDetailsPage() {
  const { data: clients, error, mutate } = useSWR<ClientDetails[], Error>("/ClientDetails.json", fetcher)
  const [search, setSearch] = React.useState("")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isEditMode, setIsEditMode] = React.useState(false)
  const [formData, setFormData] = React.useState<Omit<ClientDetails, "id">>({
    name: "",
    gst: "",
    fssai: "",
    address: "",
    phone: "",
    email: "",
  })
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [clientToDelete, setClientToDelete] = React.useState<ClientDetails | null>(null)
  const { toast } = useToast()

  const filteredClients = React.useMemo(() => {
    if (!clients) return []
    return clients.filter((client) =>
      client.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [clients, search])

  const validateForm = () => {
    const { name, gst, address, phone } = formData
    if (!name.trim()) return "Name is required"
    if (!gst.trim()) return "GST Number is required"
    if (!address.trim()) return "Address is required"
    if (!phone.trim()) return "Phone is required"
    return null
  }

  const handleCreate = async () => {
    const validationError = validateForm()
    if (validationError) {
      toast({ title: "Validation Error", description: validationError, variant: "destructive" })
      return
    }
    try {
      await createClient(formData)
      await mutate()
      setIsDialogOpen(false)
      setFormData({ name: "", gst: "", fssai: "", address: "", phone: "", email: "" })
      toast({ title: "Client created successfully", variant: "success" })
    } catch (err) {
      toast({ title: "Error", description: "Failed to create client", variant: "destructive" })
    }
  }

  const handleUpdate = async () => {
    const validationError = validateForm()
    if (validationError) {
      toast({ title: "Validation Error", description: validationError, variant: "destructive" })
      return
    }
    if (!selectedId) return
    try {
      await updateClient(selectedId, formData)
      await mutate()
      setIsDialogOpen(false)
      setSelectedId(null)
      setIsEditMode(false)
      setFormData({ name: "", gst: "", fssai: "", address: "", phone: "", email: "" })
      toast({ title: "Client updated successfully", variant: "success" })
    } catch (err) {
      toast({ title: "Error", description: "Failed to update client", variant: "destructive" })
    }
  }

  const handleEdit = (client: ClientDetails) => {
    setFormData({
      name: client.name,
      gst: client.gst || "",
      fssai: client.fssai || "",
      address: client.address || "",
      phone: client.phone || "",
      email: client.email || "",
    })
    setSelectedId(client.id)
    setIsEditMode(true)
    setIsDialogOpen(true)
  }

  const handleOpenDelete = (client: ClientDetails) => {
    setClientToDelete(client)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!clientToDelete?.id) return
    try {
      await deleteClient(clientToDelete.id)
      await mutate()
      setIsDeleteDialogOpen(false)
      setClientToDelete(null)
      toast({ title: "Client deleted successfully", variant: "success" })
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete client", variant: "destructive" })
    }
  }

  const handleOpenCreate = () => {
    setFormData({ name: "", gst: "", fssai: "", address: "", phone: "", email: "" })
    setSelectedId(null)
    setIsEditMode(false)
    setIsDialogOpen(true)
  }

  if (error) return <div className="p-4">Failed to load clients</div>
  if (!clients) return <div className="p-4">Loading...</div>

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Client Details</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{isEditMode ? "Edit Client" : "Create Client"}</DialogTitle>
              <DialogDescription>
                {isEditMode ? "Update the client details below." : "Enter the new client details below."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter client name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gst">GST Number</Label>
                <Input
                  id="gst"
                  required
                  value={formData.gst}
                  onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                  placeholder="Enter GST number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fssai">FSSAI Number</Label>
                <Input
                  id="fssai"
                  value={formData.fssai}
                  onChange={(e) => setFormData({ ...formData, fssai: e.target.value })}
                  placeholder="Enter FSSAI number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={isEditMode ? handleUpdate : handleCreate}>
                {isEditMode ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Box */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search clients by name..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Clients List */}
      <div className="space-y-4">
        {filteredClients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {search ? "No clients found." : "No clients available. Create one to get started."}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => (
              <div key={client.id} className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold">{client.name}</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>GST :</span>
                    <span>{client.gst || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>FSSAI :</span>
                    <span>{client.fssai || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Address :</span>
                    <span>{client.address || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Phone :</span>
                    <span>{client.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Email :</span>
                    <span>{client.email || '-'}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(client)}
                    className="flex-1"
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleOpenDelete(client)}
                    className="flex-1"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the client "{clientToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}