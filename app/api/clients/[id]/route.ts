// app/api/clients/[id]/route.ts
export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'public', 'ClientDetails.json');

async function readClients(): Promise<any[]> {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : []; // Ensure it's always an array
  } catch (error) {
    console.error('Error reading clients:', error);
    return [];
  }
}

async function writeClients(clients: any[]): Promise<void> {
  try {
    await fs.writeFile(filePath, JSON.stringify(clients, null, 2));
  } catch (error) {
    console.error('Error writing clients:', error);
    throw error;
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json() as Record<string, any>;
    const clients = await readClients();
    const index = clients.findIndex((c: any) => c.id === params.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    clients[index] = { ...clients[index], ...body };
    await writeClients(clients);
    return NextResponse.json(clients[index]);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clients = await readClients();
    const filteredClients = clients.filter((c: any) => c.id !== params.id);
    await writeClients(filteredClients);
    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}