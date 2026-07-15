// ═══════════════════════════════════════════════════════════════
// Addresses Page
// List, add, and manage user shipping addresses
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Alert } from '@/components/ui/Alert/Alert';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Badge } from '@/components/ui/Badge/Badge';
import styles from './addresses.module.css';

export default function AddressesPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Address form fields
  const [label, setLabel] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('US');

  // Fetch addresses
  const { data: addresses, isLoading } = useQuery({
    queryKey: ['my-addresses-list'],
    queryFn: () => api.get<any[]>('/users/me/addresses'),
  });

  const resetForm = () => {
    setLabel('');
    setFullName('');
    setPhone('');
    setAddressLine1('');
    setAddressLine2('');
    setCity('');
    setState('');
    setZipCode('');
    setCountry('US');
  };

  // Add Address Mutation
  const addMutation = useMutation({
    mutationFn: (payload: any) => api.post('/users/me/addresses', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-addresses-list'] });
      setShowAddForm(false);
      resetForm();
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to add address');
    },
  });

  // Delete Address Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/me/addresses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-addresses-list'] });
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to delete address');
    },
  });

  // Set Default Address Mutation
  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/me/addresses/${id}/default`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-addresses-list'] });
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to update default address');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    addMutation.mutate({
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2: addressLine2 || undefined,
      city,
      state,
      zipCode,
      country,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Addresses</h1>
          <p className={styles.subtitle}>Manage your shipping and billing destinations</p>
        </div>
        {!showAddForm && (
          <Button variant="primary" size="sm" onClick={() => setShowAddForm(true)}>
            Add New Address
          </Button>
        )}
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {showAddForm && (
        <Card padding="md" className={styles.card}>
          <h2 className={styles.cardTitle}>New Address</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              <Input
                id="label"
                label="Address Label (e.g. Home, Office)"
                placeholder="Home"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
              />
              <Input
                id="fullName"
                label="Recipient Full Name"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                id="phone"
                label="Recipient Phone Number"
                placeholder="+1 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <Input
                id="addressLine1"
                label="Address Line 1"
                placeholder="123 Main St"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                required
              />
              <Input
                id="addressLine2"
                label="Address Line 2 (Optional)"
                placeholder="Apt 4B"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
              />
              <Input
                id="city"
                label="City"
                placeholder="New York"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
              <Input
                id="state"
                label="State / Province"
                placeholder="NY"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
              />
              <Input
                id="zipCode"
                label="Zip / Postal Code"
                placeholder="10001"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                required
              />
              <Input
                id="country"
                label="Country"
                placeholder="US"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </div>
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" loading={addMutation.isPending}>
                Save Address
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className={styles.loaderWrapper}>
          <Spinner size="lg" />
        </div>
      ) : !addresses || addresses.length === 0 ? (
        <p className={styles.emptyMsg}>You have not added any shipping addresses yet.</p>
      ) : (
        <div className={styles.addressesGrid}>
          {addresses.map((addr: any) => (
            <Card key={addr.id} padding="md" className={`${styles.card} ${addr.isDefault ? styles.defaultCard : ''}`}>
              <div className={styles.cardHeader}>
                <strong>{addr.label}</strong>
                {addr.isDefault && <Badge variant="success">Default</Badge>}
              </div>

              <div className={styles.addressBlock}>
                <div>{addr.fullName}</div>
                <div>{addr.addressLine1}</div>
                {addr.addressLine2 && <div>{addr.addressLine2}</div>}
                <div>
                  {addr.city}, {addr.state} {addr.zipCode}
                </div>
                <div>{addr.country}</div>
                {addr.phone && <div className={styles.addressPhone}>Phone: {addr.phone}</div>}
              </div>

              <div className={styles.cardActions}>
                {!addr.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDefaultMutation.mutate(addr.id)}
                    loading={setDefaultMutation.isPending}
                  >
                    Make Default
                  </Button>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('Delete this address?')) {
                      deleteMutation.mutate(addr.id);
                    }
                  }}
                  loading={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
