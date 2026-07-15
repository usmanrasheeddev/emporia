// ═══════════════════════════════════════════════════════════════
// Account settings / profile view
// Name updates and password change forms
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Alert } from '@/components/ui/Alert/Alert';
import styles from './profile.module.css';

export default function ProfileSettingsPage() {
  const { user, setUser } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Update profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (payload: any) => api.patch<any>('/users/me', payload),
    onSuccess: (res) => {
      setProfileSuccess('Profile details updated successfully');
      if (res.data) {
        setUser(res.data);
      }
    },
    onError: (err: any) => {
      setProfileError(err.message || 'Failed to update profile details');
    },
  });

  // Change password Mutation
  const changePasswordMutation = useMutation({
    mutationFn: (payload: any) => api.patch('/users/me/password', payload),
    onSuccess: () => {
      setPwdSuccess('Account password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => {
      setPwdError(err.message || 'Failed to change password. Review credentials.');
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    updateProfileMutation.mutate({
      firstName,
      lastName,
      phone: phone || undefined,
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSuccess(null);
    setPwdError(null);

    if (newPassword !== confirmPassword) {
      setPwdError('New password and confirm password do not match');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Account Settings</h1>
        <p className={styles.subtitle}>Manage your profile details and security settings</p>
      </div>

      <div className={styles.sectionsGrid}>
        {/* Profile Card */}
        <Card padding="md" className={styles.card}>
          <h2 className={styles.cardTitle}>Profile Information</h2>
          {profileError && <Alert variant="error">{profileError}</Alert>}
          {profileSuccess && <Alert variant="success">{profileSuccess}</Alert>}

          <form onSubmit={handleProfileSubmit} className={styles.form}>
            <div className={styles.row}>
              <Input
                id="firstName"
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                id="lastName"
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <Input
              id="phone"
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Button type="submit" variant="primary" loading={updateProfileMutation.isPending}>
              Update Profile
            </Button>
          </form>
        </Card>

        {/* Password Card */}
        <Card padding="md" className={styles.card}>
          <h2 className={styles.cardTitle}>Change Password</h2>
          {pwdError && <Alert variant="error">{pwdError}</Alert>}
          {pwdSuccess && <Alert variant="success">{pwdSuccess}</Alert>}

          <form onSubmit={handlePasswordSubmit} className={styles.form}>
            <Input
              id="currentPassword"
              type="password"
              label="Current Password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              id="newPassword"
              type="password"
              label="New Password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input
              id="confirmPassword"
              type="password"
              label="Confirm New Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" loading={changePasswordMutation.isPending}>
              Change Password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
