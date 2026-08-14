import React, { useRef, useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';
import { View, Text, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system/legacy';

const MAX_PDF_JS_SIZE_MB = 20;

export interface PdfProxyProps {
  localUri?: string | null;
  onlineUrl?: string | null;
  viewerAssets: {
    htmlUri: string;
    baseDir: string;
  };
  watermark?: any;
  startPage?: number;
  onLoadComplete?: (pages: number, uri: string) => void;
  onPageChanged?: (page: number, totalPages: number) => void;
  onError?: (error: any) => void;
  style?: any;
}

export default function PdfProxy(props: PdfProxyProps) {
  const { localUri, onlineUrl, viewerAssets, watermark, startPage, style } = props;
  const webViewRef = useRef<WebView>(null);
  
  const [fileSizeMB, setFileSizeMB] = useState<number | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (onlineUrl) {
      setLoading(false);
      return;
    }
    if (!localUri) {
      setLoading(false);
      return;
    }
    const loadPdf = async () => {
      try {
        setLoading(true);
        const info = await FileSystem.getInfoAsync(localUri);
        if (info.exists) {
          const sizeMB = info.size / (1024 * 1024);
          setFileSizeMB(sizeMB);
          if (sizeMB <= MAX_PDF_JS_SIZE_MB) {
            const data = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
            setBase64Data(data);
          }
        }
      } catch (e) {
        console.error('PdfProxy Load Error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadPdf();
  }, [localUri, onlineUrl]);

  if (!localUri && !onlineUrl) return <View><Text style={{color: '#fff'}}>No PDF Source</Text></View>;

  const openNatively = async () => {
    try {
      if (Platform.OS === 'android') {
        if (localUri) {
          const contentUri = await FileSystem.getContentUriAsync(localUri);
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: contentUri,
              flags: 1,
              type: 'application/pdf'
          });
        }
      } else {
        if (localUri) {
          await Sharing.shareAsync(localUri);
        }
      }
    } catch (e) {
      console.log('Failed to open PDF natively', e);
    }
  };

  if (loading) {
    return (
      <View style={[{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#060913'}, style]}>
        <ActivityIndicator color="#10b981" />
      </View>
    );
  }

  // Use embedded PDF.js if under threshold or if it's an online URL
  if ((fileSizeMB !== null && fileSizeMB <= MAX_PDF_JS_SIZE_MB && base64Data && viewerAssets) || (onlineUrl && viewerAssets)) {
    return (
      <WebView 
         ref={webViewRef}
         source={{ uri: viewerAssets.htmlUri }}
         style={[{ flex: 1, backgroundColor: '#060913' }, style]}
         allowFileAccess={true}
         allowFileAccessFromFileURLs={true}
         allowUniversalAccessFromFileURLs={true}
         originWhitelist={['*']}
         allowingReadAccessToURL={viewerAssets.baseDir}
         onMessage={(event) => {
           try {
             const msg = JSON.parse(event.nativeEvent.data);
             if (msg.type === 'READY') {
               if (onlineUrl) {
                 webViewRef.current?.postMessage(JSON.stringify({
                   type: 'LOAD_DOCUMENT_URL',
                   url: onlineUrl,
                   config: {
                     startPage: startPage || 1,
                     watermark: watermark
                   }
                 }));
               } else {
                 webViewRef.current?.postMessage(JSON.stringify({
                   type: 'LOAD_DOCUMENT',
                   data: base64Data,
                   config: {
                     startPage: startPage || 1,
                     watermark: watermark
                   }
                 }));
               }
             } else if (msg.type === 'LOADED') {
               if (props.onLoadComplete) props.onLoadComplete(msg.pages, onlineUrl || localUri || '');
             } else if (msg.type === 'PAGE_CHANGED') {
               if (props.onPageChanged) props.onPageChanged(msg.page, msg.pages);
             } else if (msg.type === 'ERROR') {
               if (props.onError) props.onError(msg.error);
             }
           } catch (e) {}
         }}
      />
    );
  }

  // Fallback for large files
  return (
    <View style={[{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#131B2F'}, style]}>
       <Text style={{color: '#94a3b8', textAlign: 'center', marginBottom: 20}}>
         This PDF is {fileSizeMB?.toFixed(1)}MB (Exceeds {MAX_PDF_JS_SIZE_MB}MB inline limit).
       </Text>
       <TouchableOpacity 
         onPress={openNatively}
         style={{backgroundColor: '#10b981', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8}}>
         <Text style={{color: '#FFF', fontWeight: 'bold'}}>Open Native Viewer</Text>
       </TouchableOpacity>
    </View>
  );
}
