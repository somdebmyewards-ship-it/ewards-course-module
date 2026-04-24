import React from 'react';

/** Detects YouTube/Vimeo/Drive/Loom URLs and renders iframe embed; falls back to <video> for direct files. */
const VideoPlayer = ({ url: rawUrl, style }: { url: string; style?: React.CSSProperties }) => {
  const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');

  // Normalize: resolve relative paths against apiBase, and rewrite legacy
  // /storage/uploads/<file>.<ext> video URLs to the Range-enabled /media/<file>.<ext>
  // streaming endpoint so existing DB rows keep working without a data migration.
  let url = rawUrl;
  if (url.startsWith('/storage/uploads/') && /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url)) {
    const filename = url.replace(/^\/storage\/uploads\//, '');
    url = `/media/${filename}`;
  }
  if (url.startsWith('/') && apiBase) {
    url = `${apiBase}${url}`;
  }

  const iframeWrapper = (embedSrc: string) => (
    <div style={{ width: '100%', maxWidth: 820, margin: '0 auto', background: '#000', ...style }}>
      <div style={{ position: 'relative', paddingTop: '56.25%' }}>
        <iframe
          src={embedSrc}
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
        />
      </div>
    </div>
  );

  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return iframeWrapper(`https://www.youtube.com/embed/${ytMatch[1]}?rel=0`);

  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch) return iframeWrapper(`https://player.vimeo.com/video/${vimeoMatch[1]}`);

  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) return iframeWrapper(`https://drive.google.com/file/d/${driveMatch[1]}/preview`);

  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return iframeWrapper(`https://www.loom.com/embed/${loomMatch[1]}`);

  if (/youtube|youtu\.be|vimeo|drive\.google|loom\.com|embed|iframe/i.test(url)) {
    return iframeWrapper(url);
  }

  const isDirectVideo = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url) || url.includes('/media/');
  if (isDirectVideo) {
    // Compact 16:9 player:
    //  - outer wrapper centers & caps width so the video never dominates the
    //    page on wide columns (max 820px wide → max ~461px tall).
    //  - inner wrapper is the 16:9 aspect-ratio box (padding-top trick works
    //    everywhere, including older browsers).
    //  - `object-fit: contain` preserves the source's native aspect ratio
    //    (letterboxing if not 16:9), so nothing is ever cropped.
    return (
      <div style={{ width: '100%', maxWidth: 820, margin: '0 auto', background: '#000', ...style }}>
        <div style={{ position: 'relative', paddingTop: '56.25%' }}>
          <video
            controls
            preload="metadata"
            playsInline
            src={url}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              background: '#000',
              display: 'block',
            }}
            onError={(e) => {
              const parent = (e.target as HTMLElement).parentElement;
              if (parent) {
                parent.innerHTML = '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#999;background:#1a1a1a;padding:40px;text-align:center">'
                  + '<div style="font-size:48px;margin-bottom:12px">&#9658;</div>'
                  + '<div style="font-size:14px">Video unavailable — file may have been removed after deploy.</div>'
                  + '<div style="font-size:12px;margin-top:8px;color:#666">Re-upload the video or use a YouTube/Google Drive link in Content Manager.</div>'
                  + '</div>';
              }
            }}
          />
        </div>
      </div>
    );
  }

  return iframeWrapper(url);
};

export default VideoPlayer;
