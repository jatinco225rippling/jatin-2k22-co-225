'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

type AccountData = {
  id: string;
  fullName: string;
  email: string;
  sendBalance: number;
  monthlySent: number;
  receivedBalance: number;
  totalReceived: number;
  recognitionsReceivedCount: number;
  endorsementsReceived: number;
};

export default function AccountPage() {
  const router = useRouter();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemCredits, setRedeemCredits] = useState('');
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState('');

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('boostly_token') : null;

    if (!token) {
      router.push('/login');
      return;
    }

    const fetchAccount = async () => {
      try {
        const data = await api('/account/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAccount(data);
      } catch (err) {
        console.error('Error fetching account:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [router]);

  const handleRedeem = async () => {
    setRedeemError('');
    setRedeemSuccess('');

    const token =
      typeof window !== 'undefined' ? localStorage.getItem('boostly_token') : null;

    if (!token) {
      router.push('/login');
      return;
    }

    const credits = parseInt(redeemCredits, 10);
    if (!credits || credits <= 0) {
      setRedeemError('Please enter a positive number of credits.');
      return;
    }

    if (account && credits > account.receivedBalance) {
      setRedeemError('You cannot redeem more credits than you have.');
      return;
    }

    try {
      const data = await api('/account/redeem', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ credits }),
      });

      const amount = data.amountInINR;
      setRedeemSuccess(
        `Redeemed ${data.creditsRedeemed} credits for ₹${amount}. Voucher generated successfully.`
      );

      // update local account state
      if (account) {
        setAccount({
          ...account,
          receivedBalance: data.newReceivedBalance,
        });
      }

      // Fake transaction UI (you can make this fancier if you want)
    } catch (err: unknown) {
      console.error('Redeem error:', (err as Error).message);
      setRedeemError('Something went wrong while redeeming.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        Loading account...
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        Could not load account.
      </div>
    );
  }

  const voucherPreview =
    redeemCredits && !isNaN(parseInt(redeemCredits, 10))
      ? parseInt(redeemCredits, 10) * 5
      : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 py-10">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">My Account</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('boostly_token');
                localStorage.removeItem('boostly_user');
              }
              router.push('/login');
            }}
          >
            Logout
          </Button>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Name</span>
              <span className="font-medium text-slate-50">{account.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Email</span>
              <span className="font-medium text-slate-50">{account.email}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle>Credits & Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-800/60">
                <div className="text-xs text-slate-400">Sendable credits (this month)</div>
                <div className="text-xl font-semibold mt-1">
                  {account.sendBalance}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Sent so far this month: {account.monthlySent} / 100
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/60">
                <div className="text-xs text-slate-400">Redeemable credits</div>
                <div className="text-xl font-semibold mt-1">
                  {account.receivedBalance}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Worth ₹{account.receivedBalance * 5}
                </div>
              </div>
            </div>

            <Separator className="bg-slate-800" />

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-slate-400">Total credits received</div>
                <div className="text-lg font-semibold mt-1">
                  {account.totalReceived}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Recognitions received</div>
                <div className="text-lg font-semibold mt-1">
                  {account.recognitionsReceivedCount}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Endorsements received</div>
                <div className="text-lg font-semibold mt-1">
                  {account.endorsementsReceived}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
                <DialogTrigger asChild>
                  <Button disabled={account.receivedBalance <= 0}>
                    Redeem credits
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-slate-50">
                  <DialogHeader>
                    <DialogTitle>Redeem your credits</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-3 py-2">
                    <p className="text-xs text-slate-400">
                      You currently have{' '}
                      <span className="font-semibold text-slate-100">
                        {account.receivedBalance}
                      </span>{' '}
                      credits available (worth ₹{account.receivedBalance * 5}).
                      1 credit = ₹5.
                    </p>

                    <div className="space-y-2">
                      <Label htmlFor="credits">Credits to redeem</Label>
                      <Input
                        id="credits"
                        type="number"
                        min={1}
                        value={redeemCredits}
                        onChange={(e) => setRedeemCredits(e.target.value)}
                        className="bg-slate-900 border-slate-700"
                      />
                    </div>

                    {voucherPreview > 0 && (
                      <div className="text-xs text-slate-400">
                        This will generate a voucher worth{' '}
                        <span className="font-semibold text-slate-100">
                          ₹{voucherPreview}
                        </span>
                        .
                      </div>
                    )}

                    {redeemError && (
                      <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded px-3 py-2">
                        {redeemError}
                      </p>
                    )}

                    {redeemSuccess && (
                      <p className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900 rounded px-3 py-2">
                        {redeemSuccess}
                      </p>
                    )}

                    {/* Fake transaction UI */}
                    {redeemSuccess && (
                      <div className="mt-2 text-xs text-slate-300 border border-slate-800 rounded-md p-3">
                        <div className="font-semibold mb-1">Voucher preview</div>
                        <div className="flex justify-between">
                          <span>Voucher ID</span>
                          <span>#BOOSTLY-{account.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Amount</span>
                          <span>₹{voucherPreview}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status</span>
                          <span className="text-emerald-400">Success</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRedeemOpen(false)}>
                      Close
                    </Button>
                    <Button onClick={handleRedeem}>Confirm redeem</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
