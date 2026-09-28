import type { Component } from 'react';
import type { ViewProps } from 'react-native';

declare module 'expo-camera' {
  export type CameraType = 'front' | 'back';
  export type FlashMode = 'off' | 'on' | 'auto' | 'screen';
  export type FocusMode = 'on' | 'off';

  export interface CameraCapturedPicture {
    width: number;
    height: number;
    uri: string;
    base64?: string;
    exif?: Record<string, any>;
  }

  export interface CameraPictureOptions {
    quality?: number;
    base64?: boolean;
    exif?: boolean;
    skipProcessing?: boolean;
    shutterSound?: boolean;
    imageType?: 'jpg' | 'png';
  }

  export interface CameraViewProps extends ViewProps {
    facing?: CameraType;
    flash?: FlashMode;
    autofocus?: FocusMode;
    zoom?: number;
    mute?: boolean;
    active?: boolean;
    onCameraReady?: () => void;
    onMountError?: (error: { message: string }) => void;
  }

  export class CameraView extends Component<CameraViewProps> {
    takePictureAsync(options?: CameraPictureOptions): Promise<CameraCapturedPicture>;
    resumePreview(): Promise<void>;
    pausePreview(): Promise<void>;
  }

  export interface PermissionResponse {
    status: 'granted' | 'undetermined' | 'denied';
    granted: boolean;
    expires: 'never' | number;
    canAskAgain: boolean;
  }

  export function useCameraPermissions(): [
    PermissionResponse | null,
    () => Promise<PermissionResponse>,
    () => Promise<PermissionResponse>
  ];

  export function useMicrophonePermissions(): [
    PermissionResponse | null,
    () => Promise<PermissionResponse>,
    () => Promise<PermissionResponse>
  ];
}
