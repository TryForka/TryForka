import React from 'react';
import { cx } from './ds';
import { NAV_ITEMS, TAB_BAR_HEIGHT, type NavId } from './nav';

// App frame: left sidebar on desktop, bottom tab bar under 768px. Same four items.

/** The Forka wordmark, unchanged from the original sidebar. */
function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <img src={`${import.meta.env.BASE_URL}forka-logo.png`} alt="" className="size-9 shrink-0 rounded-[10px] object-cover" />
      <span style={{ fontSize: 22, fontFamily: '"Poppins", sans-serif', fontWeight: 700, color: 'rgba(10,37,51,1)', letterSpacing: '-0.5px' }}>
        Forka
      </span>
    </div>
  );
}

export function Sidebar({ active, onSelect }: { active: NavId | null; onSelect: (id: NavId) => void }) {
  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-line bg-surface">
      <div className="border-b border-line px-5 pt-7 pb-6"><Wordmark /></div>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5 px-3 py-4">
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cx(
                'flex h-11 w-full cursor-pointer items-center gap-3 rounded-control px-3 text-left text-base transition-colors duration-150',
                isActive ? 'bg-basil-soft font-semibold text-basil' : 'font-medium text-ink-muted hover:bg-canvas hover:text-ink',
              )}
            >
              <Icon size={20} strokeWidth={1.75} aria-hidden />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export function BottomTabBar({ active, onSelect }: { active: NavId | null; onSelect: (id: NavId) => void }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface"
      style={{ height: `calc(${TAB_BAR_HEIGHT}px + env(safe-area-inset-bottom, 0px))`, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {NAV_ITEMS.map(item => {
        const isActive = active === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className={cx(
              'flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-xs',
              isActive ? 'font-semibold text-basil' : 'font-medium text-ink-muted',
            )}
          >
            <Icon size={22} strokeWidth={1.75} aria-hidden />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

/** Sidebar + scrolling content column (desktop) or content + tab bar (phone). */
export function AppFrame({ isPhone, active, onSelect, showNav, children, mainRef, overlay }: {
  isPhone: boolean;
  active: NavId | null;
  onSelect: (id: NavId) => void;
  /** False in cooking mode, which has its own full-screen controls. */
  showNav: boolean;
  children: React.ReactNode;
  mainRef?: React.Ref<HTMLElement>;
  overlay?: React.ReactNode;
}) {
  const tabSpace = isPhone && showNav ? `calc(${TAB_BAR_HEIGHT}px + env(safe-area-inset-bottom, 0px))` : '0px';
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-canvas">
      {!isPhone && showNav && <Sidebar active={active} onSelect={onSelect} />}
      <main
        ref={mainRef}
        className="relative min-w-0 flex-1 overflow-y-auto"
        style={{ paddingBottom: tabSpace, '--tabbar-h': tabSpace } as React.CSSProperties}
      >
        {children}
      </main>
      {isPhone && showNav && <BottomTabBar active={active} onSelect={onSelect} />}
      {overlay}
    </div>
  );
}
