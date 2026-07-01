'use client';

import { useState, type FormEvent } from 'react';
import { TextField } from './TextField';
import { Button } from './Button';
import type { Product } from '@/lib/types';

export interface ProductFormValues {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  sizes: string[];
  colors: string[];
  inStock: boolean;
}

function toCsv(values: string[]): string {
  return values.join(', ');
}

function fromCsv(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export function ProductForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Product;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [sizes, setSizes] = useState(toCsv(initial?.sizes ?? []));
  const [colors, setColors] = useState(toCsv(initial?.colors ?? []));
  const [inStock, setInStock] = useState(initial?.inStock ?? true);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const numericPrice = Number(price);
    if (!name.trim() || Number.isNaN(numericPrice) || numericPrice < 0) {
      setError('Please add a name and a valid price.');
      return;
    }
    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      price: numericPrice,
      imageUrl: imageUrl.trim() || undefined,
      sizes: fromCsv(sizes),
      colors: fromCsv(colors),
      inStock,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField label="Product name" required value={name} onChange={(e) => setName(e.target.value)} />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink/80">Description</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-md border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary"
          placeholder="Fabric, fit, anything customers usually ask about."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Price (₹)"
          type="number"
          min={0}
          step="0.01"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <TextField
          label="Image URL"
          type="url"
          placeholder="https://…"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Sizes"
          placeholder="S, M, L, XL"
          hint="Comma separated"
          value={sizes}
          onChange={(e) => setSizes(e.target.value)}
        />
        <TextField
          label="Colors"
          placeholder="Black, Blue"
          hint="Comma separated"
          value={colors}
          onChange={(e) => setColors(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => setInStock(e.target.checked)}
          className="h-4 w-4 rounded border-line text-primary focus:ring-primary"
        />
        In stock
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="mt-2 flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? 'Save changes' : 'Add product'}
        </Button>
      </div>
    </form>
  );
}
