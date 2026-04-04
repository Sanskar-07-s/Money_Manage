import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Radio, WandSparkles } from 'lucide-react';
import VoiceScene3D from './VoiceScene3D';
import GlassBox from './GlassBox';

export default function VoiceCommandCenter({
  isListening,
  isSupported,
  mode,
  transcriptPreview,
  banner,
  lastCommand,
  onToggleMode,
  onPushStart,
  onPushStop,
  onToggleListening,
}) {
  return (
    <GlassBox className="relative overflow-hidden p-4 md:p-6 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(14,116,144,0.92),rgba(8,47,73,0.95))] text-white border-white/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.24),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.18),transparent_30%)]" />
      <div className="relative space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-100">
              <WandSparkles size={12} />
              Voice Command Center
            </div>
            <h2 className="mt-3 text-2xl font-display font-black tracking-tight md:text-3xl">
              Talk to your dashboard and watch it respond live
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-200/90 md:text-base">
              Speak a transaction, ask for a balance, or request insights. Pointer and touch controls stay active while the 3D scene animates every update.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onToggleMode}
              className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] transition-colors ${
                mode === 'always-listening'
                  ? 'bg-amber-300 text-slate-900'
                  : 'bg-white/10 text-white'
              }`}
            >
              {mode === 'always-listening' ? 'Always Listening' : 'Push To Talk'}
            </button>

            <button
              type="button"
              onMouseDown={mode === 'push-to-talk' ? onPushStart : undefined}
              onMouseUp={mode === 'push-to-talk' ? onPushStop : undefined}
              onMouseLeave={mode === 'push-to-talk' ? onPushStop : undefined}
              onTouchStart={mode === 'push-to-talk' ? onPushStart : undefined}
              onTouchEnd={mode === 'push-to-talk' ? onPushStop : undefined}
              onClick={mode === 'always-listening' ? onToggleListening : undefined}
              disabled={!isSupported}
              className={`group relative flex h-16 w-16 items-center justify-center rounded-full border transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                isListening
                  ? 'border-emerald-300 bg-emerald-400 text-slate-950 shadow-[0_0_40px_rgba(74,222,128,0.45)]'
                  : 'border-white/15 bg-white/10 text-white'
              }`}
            >
              <span className={`absolute inset-0 rounded-full ${isListening ? 'animate-ping bg-emerald-300/25' : ''}`} />
              {isListening ? <Mic size={22} className="relative" /> : <MicOff size={22} className="relative" />}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
          <VoiceScene3D
            isListening={isListening}
            messageCount={lastCommand ? 6 : 3}
            transcriptPreview={transcriptPreview || lastCommand}
          />

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
                  <Radio size={14} />
                  Recording
                </div>
                <p className="mt-3 text-2xl font-display font-black">{isListening ? 'Live' : 'Standby'}</p>
                <p className="mt-2 text-sm text-slate-200/80">
                  {isListening ? 'Voice stream is active and parsing in real time.' : 'Tap, click, or press-and-hold the mic to start.'}
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100">Last Command</div>
                <p className="mt-3 min-h-[3.75rem] text-sm leading-relaxed text-slate-100">
                  {lastCommand || 'Try "Spent 30 rupees on bhel" or "Show me balance for snacks".'}
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {banner ? (
                <motion.div
                  key={banner}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-[1.75rem] border border-emerald-300/20 bg-emerald-300/10 p-4"
                >
                  <p className="text-sm font-semibold leading-relaxed text-emerald-50">{banner}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                'Spent 30 rupees on bhel',
                'Add 200 to savings',
                'Show me balance for snacks',
                'Give me spending insights',
              ].map((example) => (
                <div
                  key={example}
                  className="rounded-2xl border border-white/10 bg-black/15 p-3 text-xs font-semibold tracking-wide text-slate-100"
                >
                  {example}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </GlassBox>
  );
}
