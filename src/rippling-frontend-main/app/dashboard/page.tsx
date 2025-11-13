'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

type LeaderboardRow = {
  rank: number;
  id: string;
  fullName: string;
  email: string;
  totalCreditsReceived: number;
  recognitionsReceivedCount: number;
  endorsementsReceived: number;
};

type RecognitionItem = {
  id: string;
  senderName: string;
  senderEmail: string;
  credits: number;
  message: string;
  createdAt: string;
  endorsementsCount: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [error, setError] = useState('');

  // Give kudos dialog state
  const [kudosOpen, setKudosOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<LeaderboardRow | null>(null);
  const [kudosCredits, setKudosCredits] = useState('');
  const [kudosMessage, setKudosMessage] = useState('');
  const [kudosError, setKudosError] = useState('');
  const [kudosSuccess, setKudosSuccess] = useState('');

  // View recognitions dialog state
  const [recogOpen, setRecogOpen] = useState(false);
  const [recogTarget, setRecogTarget] = useState<LeaderboardRow | null>(null);
  const [recogs, setRecogs] = useState<RecognitionItem[]>([]);
  const [recogLoading, setRecogLoading] = useState(false);

  // Fetch leaderboard
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api('/leaderboard?limit=10', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setRows(data);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [router]);

  const openKudosDialog = (student: LeaderboardRow) => {
    setSelectedStudent(student);
    setKudosCredits('');
    setKudosMessage('');
    setKudosError('');
    setKudosSuccess('');
    setKudosOpen(true);
  };

  const handleSendKudos = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setKudosError('');
    setKudosSuccess('');

    const credits = parseInt(kudosCredits, 10);
    if (!credits || credits <= 0) {
      setKudosError('Please enter a positive number of credits.');
      return;
    }

    try {
      const data = await api('/recognitions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: selectedStudent?.id,
          credits,
          message: kudosMessage,
        }),
      });

      console.log('Kudos sent:', data);
      setKudosSuccess('Recognition sent successfully!');
      setKudosCredits('');
      setKudosMessage('');

      // refresh leaderboard so totals update
      const fresh = await api('/leaderboard?limit=10', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRows(fresh);
    } catch (err: unknown) {
      console.error('Error sending kudos:', (err as Error).message);
      // Try to extract message if backend sends JSON
      setKudosError('Unable to send recognition. Check your credits and try again.');
    }
  };

  const openRecognitionsDialog = async (student: LeaderboardRow) => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setRecogTarget(student);
    setRecogOpen(true);
    setRecogLoading(true);
    setRecogs([]);

    try {
      const data = await api(`/recognitions/receiver/${student.id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRecogs(data);
    } catch (err) {
      console.error('Error fetching recognitions:', err);
    } finally {
      setRecogLoading(false);
    }
  };

  const handleEndorse = async (recognitionId: string) => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      await api('/endorsements', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recognitionId }),
      });

      // Update endorsement count locally
      setRecogs((prev) =>
        prev.map((r) =>
          r.id === recognitionId
            ? { ...r, endorsementsCount: r.endorsementsCount + 1 }
            : r
        )
      );
    } catch (err: unknown) {
      console.error('Error endorsing:', (err as Error).message);
      // could show toast, keeping simple here
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        Loading leaderboard…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle>Top recipients leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {rows.length === 0 ? (
            <p className="text-sm text-slate-400">
              No recognitions yet. Be the first to send some kudos!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="text-right">
                      Total credits received
                    </TableHead>
                    <TableHead className="hidden md:table-cell text-right">
                      Recognitions
                    </TableHead>
                    <TableHead className="hidden md:table-cell text-right">
                      Endorsements
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.rank}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{row.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-slate-400">
                        {row.email}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.totalCreditsReceived}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right">
                        {row.recognitionsReceivedCount}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right">
                        {row.endorsementsReceived}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRecognitionsDialog(row)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openKudosDialog(row)}
                          >
                            Give kudos
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Give kudos dialog */}
      <Dialog open={kudosOpen} onOpenChange={setKudosOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-50">
          <DialogHeader>
            <DialogTitle>
              Send recognition {selectedStudent && `to ${selectedStudent.fullName}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="credits">Credits to send</Label>
              <Input
                id="credits"
                type="number"
                min={1}
                value={kudosCredits}
                onChange={(e) => setKudosCredits(e.target.value)}
                className="bg-slate-900 border-slate-700"
              />
              <p className="text-xs text-slate-400">
                You cannot exceed your monthly send limit or available sending balance.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                rows={3}
                value={kudosMessage}
                onChange={(e) => setKudosMessage(e.target.value)}
                className="bg-slate-900 border-slate-700"
                placeholder="Thanks for helping with the lab, etc."
              />
            </div>

            {kudosError && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded px-3 py-2">
                {kudosError}
              </p>
            )}
            {kudosSuccess && (
              <p className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900 rounded px-3 py-2">
                {kudosSuccess}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKudosOpen(false)}>
              Close
            </Button>
            <Button onClick={handleSendKudos}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View recognitions + endorsements dialog */}
      <Dialog open={recogOpen} onOpenChange={setRecogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-50 max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Recognitions for {recogTarget ? recogTarget.fullName : ''}
            </DialogTitle>
          </DialogHeader>

          {recogLoading ? (
            <p className="text-sm text-slate-400">Loading recognitions…</p>
          ) : recogs.length === 0 ? (
            <p className="text-sm text-slate-400">
              No recognitions yet for this student.
            </p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {recogs.map((r) => (
                <div
                  key={r.id}
                  className="border border-slate-800 rounded-md p-3 space-y-2"
                >
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>
                      From{' '}
                      <span className="font-medium text-slate-100">
                        {r.senderName}
                      </span>
                    </span>
                    <span>
                      {new Date(r.createdAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <Separator className="bg-slate-800" />
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm">
                        <span className="font-semibold">{r.credits}</span>{' '}
                        credits
                      </div>
                      {r.message && (
                        <p className="text-xs text-slate-300 mt-1">
                          “{r.message}”
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEndorse(r.id)}
                      >
                        👍 Endorse
                      </Button>
                      <span className="text-xs text-slate-400">
                        {r.endorsementsCount} endorsement
                        {r.endorsementsCount === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
