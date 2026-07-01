'use client';

import { useEffect, useState } from 'react';
import { Package, Plus, Pencil, Trash2 } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { ProductForm, type ProductFormValues } from '@/components/ProductForm';
import { EmptyState } from '@/components/EmptyState';
import { api, ApiError } from '@/lib/api';
import type { Product } from '@/lib/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await api.get<Product[]>('/products');
    setProducts(data);
  }

  useEffect(() => {
    load().catch(() => setProducts([]));
  }, []);

  function openCreate() {
    setEditing(null);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(values: ProductFormValues) {
    setSubmitting(true);
    setError(null);
    try {
      if (editing) {
        await api.patch(`/products/${editing.id}`, values);
      } else {
        await api.post('/products', values);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the product.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Remove "${product.name}"? This can't be undone.`)) return;
    await api.delete(`/products/${product.id}`);
    await load();
  }

  return (
    <div>
      <Topbar title="Products" />
      <div className="p-8">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-ink/55">
            Your AI assistant only talks about what's listed here.
          </p>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add product
          </Button>
        </div>

        {products === null ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-lg bg-line/60" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products yet"
            description="Add your first product so your assistant knows what to tell customers."
            action={<Button onClick={openCreate}>Add your first product</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div key={product.id} className="rounded-lg border border-line bg-white p-5 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{product.name}</p>
                    <p className="mt-0.5 font-display text-lg text-primary-dark">
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </p>
                  </div>
                  {!product.inStock && (
                    <span className="rounded-full bg-danger-light px-2.5 py-1 text-xs font-medium text-danger">
                      Out of stock
                    </span>
                  )}
                </div>
                {product.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-ink/60">{product.description}</p>
                )}
                {(product.sizes.length > 0 || product.colors.length > 0) && (
                  <p className="mt-2 text-xs text-ink/45">
                    {[product.sizes.join(' · '), product.colors.join(' · ')]
                      .filter(Boolean)
                      .join('  /  ')}
                  </p>
                )}
                <div className="mt-4 flex gap-2 border-t border-line pt-3">
                  <button
                    onClick={() => openEdit(product)}
                    className="flex items-center gap-1.5 text-xs font-medium text-ink/60 hover:text-ink"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="flex items-center gap-1.5 text-xs font-medium text-danger hover:text-danger/80"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Edit product' : 'Add product'} onClose={() => setModalOpen(false)}>
          {error && <p className="mb-3 text-sm text-danger">{error}</p>}
          <ProductForm
            initial={editing ?? undefined}
            submitting={submitting}
            onCancel={() => setModalOpen(false)}
            onSubmit={handleSubmit}
          />
        </Modal>
      )}
    </div>
  );
}
