import { useState } from 'react';
import { Mail, Copy, CheckCheck } from 'lucide-react';
import Modal from './Modal';
import { buildEmailHtml, buildMailtoUrl } from '../../utils/format';

interface Props {
  text: string;
  open: boolean;
  onClose: () => void;
}

export default function ShareModal({ text, open, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html':  new Blob([buildEmailHtml(text)], { type: 'text/html' }),
          'text/plain': new Blob([text],                 { type: 'text/plain' }),
        }),
      ]);
    } catch {
      await navigator.clipboard.writeText(text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleMail() {
    window.location.href = buildMailtoUrl(text);
  }

  return (
    <Modal open={open} onClose={onClose} title="Share Quote">
      {/* Email preview */}
      <div
        className="rounded-xl overflow-auto border border-gray-100 bg-white mb-4"
        style={{ maxHeight: '340px' }}
        dangerouslySetInnerHTML={{ __html: buildEmailHtml(text) }}
      />

      <p className="text-center text-xs text-gray-400 mb-4">
        Open in Mail, then paste <span className="font-mono bg-gray-100 px-1 rounded">Ctrl+V</span> in the email body for the formatted version above.
      </p>

      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all active:scale-95 ${
            copied
              ? 'bg-brand-50 border-brand-200 text-brand-600'
              : 'bg-white border-gray-200 text-gray-600 hover:border-brand-200 hover:text-brand-600'
          }`}
        >
          {copied ? <CheckCheck size={15} /> : <Copy size={15} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={handleMail}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#8B5CF6)' }}
        >
          <Mail size={15} />
          Open in Mail
        </button>
      </div>
    </Modal>
  );
}
