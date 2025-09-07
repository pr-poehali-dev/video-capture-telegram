import { forwardRef } from 'react';
import Icon from '@/components/ui/icon';

interface VideoPreviewProps {
  isRecording: boolean;
}

const VideoPreview = forwardRef<HTMLVideoElement, VideoPreviewProps>(
  ({ isRecording }, ref) => {
    return (
      <div className="space-y-4">
        {/* Camera Preview */}
        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
          <video
            ref={ref}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>

        {/* Recording Status */}
        <div className="text-center">
          {isRecording && (
            <div className="flex items-center justify-center gap-2 text-red-500">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Идет запись...</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

VideoPreview.displayName = 'VideoPreview';

export default VideoPreview;