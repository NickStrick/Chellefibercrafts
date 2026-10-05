'use client';

import { useMemo, useState } from 'react';
import { useSite } from '@/context/SiteContext';
import MediaPicker from './MediaPicker';
import { getSiteId } from '@/lib/siteId';
import ConfigModal from './ConfigModal';
import SettingsModal from './SettingsModal';
import AdminThemePanel from './AdminThemePanel';
import AdminAIChatPanel from './AdminAIChatPanel';
import OrdersModal from './OrdersModal';
import ProductsModal from './ProductsModal';
import ClassesModal from './ClassesModal';
import { applySiteConfigPatch } from '@/lib/siteConfigPatch';
import { isAdminAiUiEnabled } from '@/lib/adminAi';
import type { SiteConfig } from '@/types/site';

type PickerKind = 'generic' | 'video-files' | 'video-posters';

export default function AdminBar() {
  const { config, setConfig } = useSite();
  const adminAiEnabled = isAdminAiUiEnabled();
  const [openPicker, setOpenPicker] = useState(false);
  const [kind, setKind] = useState<PickerKind>('generic');
  const [showConfig, setShowConfig] = useState(false);
  const [configInitialPatch, setConfigInitialPatch] = useState<Partial<SiteConfig> | null>(null);
  const [configOpenInPreview, setConfigOpenInPreview] = useState(false);
  const [configExternalPatch, setConfigExternalPatch] = useState<Partial<SiteConfig> | null>(null);
  const [configExternalPatchNonce, setConfigExternalPatchNonce] = useState(0);
  const [configExternalPatchPreview, setConfigExternalPatchPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [showClasses, setShowClasses] = useState(false);

  const siteId = getSiteId();
  const bucket = process.env.NEXT_PUBLIC_S3_DEFAULT_BUCKET;

  const hasVideo = useMemo(
    () => !!config?.sections?.some(s => s.type === 'video' && s.visible !== false),
    [config?.sections]
  );

  const prefix = useMemo(() => {
    switch (kind) {
      case 'video-files':
        return `configs/${siteId}/videos/`;
      case 'video-posters':
        return `configs/${siteId}/assets/`;
      default:
        return `configs/${siteId}/assets/`;
    }
  }, [kind, siteId]);

  return (
    <div data-admin-ui="true">
      <div className="fixed right-4 top-4 z-[10000]">
        <div className="card admin-card card-solid card-full px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="font-semibold">Admin Mode</span>

          <button
            className="btn btn-primary"
            onClick={() => {
              setConfigInitialPatch(null);
              setConfigOpenInPreview(false);
              setConfigExternalPatch(null);
              setConfigExternalPatchNonce(0);
              setConfigExternalPatchPreview(false);
              setShowConfig(true);
            }}
            title="Edit site config (sections, fields, media links)"
          >
            Edit Sections
          </button>

          

          <button
            className={showThemePanel ? 'btn btn-primary' : 'btn btn-inverted'}
            onClick={() => setShowThemePanel((v) => !v)}
            title="Toggle theme switcher"
          >
            Theme
          </button>

          {adminAiEnabled && (
            <button
              className={showAI ? 'btn btn-primary' : 'btn btn-inverted'}
              onClick={() => setShowAI((v) => !v)}
              title="AI assistant"
            >
              AI
            </button>
          )}

          <button
            className={showOrders ? 'btn btn-primary' : 'btn btn-inverted'}
            onClick={() => setShowOrders((v) => !v)}
            title="Manage orders"
          >
            Orders
          </button>

          <button
            className={showProducts ? 'btn btn-primary' : 'btn btn-inverted'}
            onClick={() => setShowProducts((v) => !v)}
            title="Manage products"
          >
            Products
          </button>

          <button
            className={showClasses ? 'btn btn-primary' : 'btn btn-inverted'}
            onClick={() => setShowClasses((v) => !v)}
            title="Manage classes"
          >
            Classes
          </button>

          <button
            className="btn btn-inverted"
            onClick={() => setShowSettings(true)}
            title="Edit site settings (payments, general)"
          >
            Settings
          </button>

          {/* <button
            className="btn btn-inverted"
            onClick={() => { setKind('generic'); setOpenPicker(true); }}
          >
            Media Files
          </button> */}

          {hasVideo && (
            <>
              {/* <button
                className="btn btn-primary"
                onClick={() => { setKind('video-files'); setOpenPicker(true); }}
                title="Upload/select MP4 files for Video sections"
              >
                Manage Video Files
              </button>
              <button
                className="btn btn-primary"
                onClick={() => { setKind('video-posters'); setOpenPicker(true); }}
                title="Upload/select poster images for Video sections"
              >
                Manage Video Posters
              </button> */}
            </>
          )}
        </div>
      </div>

      {/* Media Picker modal */}
      {openPicker && (
        <div className="fixed inset-0 z-[11000] bg-black/50 flex items-center justify-center p-4">
          <div className="card admin-card card-solid p-4 relative w-fit !max-w-full pr-[70px] max-h-[100vh] overflow-auto">
            <button
              onClick={() => setOpenPicker(false)}
              className="absolute right-3 top-3 btn btn-ghost"
              aria-label="Close"
            >
              ✕
            </button>

            <MediaPicker
              bucket={bucket}
              prefix={prefix}
              onPick={(key) => {
                console.log(`[${kind}] picked:`, key);
                setOpenPicker(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Config editor modal */}
      {showConfig && (
        <ConfigModal
          initialPatch={configInitialPatch}
          openInPreview={configOpenInPreview}
          externalPatch={configExternalPatch}
          externalPatchNonce={configExternalPatchNonce}
          externalPatchPreview={configExternalPatchPreview}
          onClose={() => {
            setShowConfig(false);
            setConfigInitialPatch(null);
            setConfigOpenInPreview(false);
            setConfigExternalPatch(null);
            setConfigExternalPatchNonce(0);
            setConfigExternalPatchPreview(false);
          }}
        />
      )}

      {/* Settings editor modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* Theme switcher panel */}
      {showThemePanel && <AdminThemePanel />}

      {/* AI assistant drawer */}
      {adminAiEnabled && showAI && config && (
        <AdminAIChatPanel
          title="AI Assistant"
          config={config}
          onApplyPatch={(patch) => {
            // Use the same draft+preview flow as "Edit Sections" instead of mutating live config.
            // This keeps the changes unsaved until the user explicitly saves from the preview overlay.
            setConfigExternalPatch(patch);
            setConfigExternalPatchPreview(true);
            setConfigExternalPatchNonce((n) => n + 1);
            setShowConfig(true);
          }}
          onClose={() => setShowAI(false)}
        />
      )}

      {/* Orders modal */}
      {showOrders && <OrdersModal onClose={() => setShowOrders(false)} />}

      {/* Products modal */}
      {showProducts && <ProductsModal onClose={() => setShowProducts(false)} />}

      {/* Classes modal */}
      {showClasses && <ClassesModal onClose={() => setShowClasses(false)} />}
    </div>
  );
}
