// app/api/clients/route.ts
export const runtime = "nodejs"; // Edge runtime (comment out or remove to use Node.js runtime for fs/path support)
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'public', 'ClientDetails.json');

async function readClients(): Promise<any[]> {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
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

export async function GET() {
  try {
    const clients = await readClients();
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to load clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Omit<any, 'id'>;
    const clients = await readClients();
    const newClient = {
      id: crypto.randomUUID(),
      ...body,
    };
    clients.push(newClient);
    await writeClients(clients);
    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
