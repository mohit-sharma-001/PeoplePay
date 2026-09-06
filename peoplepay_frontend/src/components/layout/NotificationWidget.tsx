import React, { useEffect, useState, useRef } from 'react';
import { Bell, Mail, CheckCheck, RefreshCw, X, FileText, Clock, Inbox, ShieldCheck, CheckCircle2, ExternalLink, Eye } from 'lucide-react';
import { notificationsApi, NotificationItem } from '../../services/api/notifications';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export const NotificationWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState<boolean>(true);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await notificationsApi.getNotifications();
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    const loadPdfBlob = async () => {
      if (!selectedNotification?.payslip_id) {
        setPdfBlobUrl(null);
        return;
      }
      try {
        const token = localStorage.getItem('peoplepay_token') || localStorage.getItem('auth_token') || '';
        const endpoint = `/api/payroll/payslips/${selectedNotification.payslip_id}/pdf/${token ? `?token=${token}` : ''}`;
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Token ${token}`;
        }

        const res = await fetch(endpoint, { headers });
        if (res.ok) {
          const blob = await res.blob();
          if (active) {
            createdUrl = URL.createObjectURL(blob);
            setPdfBlobUrl(createdUrl);
          }
        }
      } catch (err) {
        console.warn('Failed to load PDF blob:', err);
      }
    };

    loadPdfBlob();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [selectedNotification?.payslip_id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenNotification = (item: NotificationItem) => {
    setSelectedNotification(item);
    setShowPdfPreview(true);
    setIsOpen(false);
    if (!item.is_read) {
      handleMarkRead(item.id);
    }
  };

  const formatTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString();
    } catch {
      return isoStr;
    }
  };

  const token = localStorage.getItem('peoplepay_token') || localStorage.getItem('auth_token') || '';
  const directPdfUrl = selectedNotification?.payslip_id
    ? `/api/payroll/payslips/${selectedNotification.payslip_id}/pdf/${token ? `?token=${token}` : ''}`
    : null;
  const activePdfSrc = pdfBlobUrl || directPdfUrl;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Button next to Role Badge */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative flex items-center justify-center p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
        title="Email & System Notifications"
      >
        <Bell className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white px-1 shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-2xl z-50 overflow-hidden text-xs">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-primary)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="font-bold text-[var(--text-primary)] text-sm">Notifications & Mails</span>
              {unreadCount > 0 && (
                <span className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchNotifications}
                disabled={isLoading}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md transition-colors cursor-pointer"
                title="Refresh notifications"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border-color)]">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-[var(--text-muted)]">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-500" />
                <p className="font-semibold text-xs">No notifications yet</p>
                <p className="text-[10px] mt-0.5">Email and payrun delivery alerts will appear here.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenNotification(item)}
                  className={`p-3.5 transition-colors cursor-pointer flex gap-3 ${
                    !item.is_read
                      ? 'bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100/50 dark:hover:bg-purple-900/30'
                      : 'hover:bg-[var(--bg-surface-elevated)]'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                      <Mail className="w-4 h-4" />
                    </span>
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs ${!item.is_read ? 'font-bold text-[var(--text-primary)]' : 'font-semibold text-[var(--text-secondary)]'}`}>
                        {item.title}
                      </h4>
                      {!item.is_read && <span className="h-2 w-2 rounded-full bg-purple-600 shrink-0" />}
                    </div>

                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">{item.message}</p>

                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-medium pt-0.5">
                      <span>{formatTime(item.created_at)}</span>
                      <span className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">Click to view mail &rarr;</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Full Screen Dialogue / Modal Box for Selected Mail Notification */}
      {selectedNotification && (
        <Modal
          isOpen={!!selectedNotification}
          onClose={() => setSelectedNotification(null)}
          title={selectedNotification.title}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Verified System Email Dispatch
              </span>
              <Button variant="secondary" onClick={() => setSelectedNotification(null)}>
                Close Window
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Email Header Info Card */}
            <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Inbox className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <strong>From:</strong> PeoplePay 360 Payroll System &lt;payroll@peoplepay360.com&gt;
                </span>
                <span className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {selectedNotification.notification_type || 'Email Sent'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <strong>Date:</strong> {formatTime(selectedNotification.created_at)}
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Received & Delivered
                </span>
              </div>
            </div>

            {/* Main Email Body Dialogue Content */}
            <div className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] space-y-3 shadow-inner">
              <h3 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                {selectedNotification.title}
              </h3>
              <div className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap font-sans min-h-[80px]">
                {selectedNotification.message}
              </div>
            </div>

            {/* Viewable PDF Attachment Section */}
            {(selectedNotification.payslip_id ||
              selectedNotification.title.toLowerCase().includes('payslip') ||
              selectedNotification.message.toLowerCase().includes('payslip')) && (
              <div className="space-y-3 pt-1">
                <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text-primary)] text-sm">Official Payslip PDF Document</p>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        Attached PDF Document dispatch
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activePdfSrc && (
                      <a
                        href={activePdfSrc}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open PDF in New Tab
                      </a>
                    )}
                    {activePdfSrc && (
                      <button
                        type="button"
                        onClick={() => setShowPdfPreview(!showPdfPreview)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {showPdfPreview ? 'Hide Preview' : 'View PDF Preview'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Embedded PDF Viewer Frame */}
                {showPdfPreview && activePdfSrc && (
                  <div className="rounded-xl border border-[var(--border-color)] overflow-hidden shadow-lg bg-slate-900">
                    <div className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-between border-b border-slate-700">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-blue-400" /> Embedded PDF Viewer
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Authenticated PDF Stream</span>
                    </div>
                    <iframe
                      src={activePdfSrc}
                      className="w-full h-80 sm:h-96 border-0 bg-white"
                      title="Attached Payslip PDF Preview"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

