import React from 'react';

/** Detects YouTube/Vimeo/Drive/Loom URLs and renders iframe embed; falls back to <video> for direct files */
const VideoPlayer = ({ url: rawUrl, style }: { url: string; style?: React.CSSProperties }) => {
  const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');
  const url = rawUrl.startsWith('/storage/') && apiBase ? `${apiBase}${rawUrl}` : rawUrl;

  const iframeWrapper = (embedSrc: string) => (
    <div style={{ position: 'relative', paddingTop: '56.25%', ...style }}>
      <iframe
        src={embedSrc}
        title="Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
      />
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

  const isDirectVideo = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url);
  if (isDirectVideo) {
    return (
      <video
        controls
        style={{ width: '100%', display: 'block' }}
        src={url}
        onError={(e) => {
          const parent = (e.target as HTMLElement).parentElement;
          if (parent) {
            parent.innerHTML = '<div style="padding:40px;text-align:center;color:#999;background:#1a1a1a">'
              + '<div style="font-size:48px;margin-bottom:12px">&#9658;</div>'
              + '<div style="font-size:14px">Video unavailable — file may have been removed after deploy.</div>'
              + '<div style="font-size:12px;margin-top:8px;color:#666">Re-upload the video or use a YouTube/Google Drive link in Content Manager.</div>'
              + '</div>';
          }
        }}
      />
    );
  }

  return iframeWrapper(url);
};

export default VideoPlayer;
