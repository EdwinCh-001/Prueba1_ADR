import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { Text } from '../components/ui/text';
import { LottieState } from '../components/ui/lottie-state';
import readingSavedAnimation from '../../assets/animations/reading-saved.json';

import {
  FloatingToast,
  type FloatingToastMessage,
  type FloatingToastTone,
} from '../components/ui/floating-toast';


export type NoticeTone = 'info' | 'success' | 'warning' | 'danger';

interface NoticeAction {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface NoticeRequest {
  title: string;
  message: string;
  tone?: NoticeTone;
  actions?: NoticeAction[];
  animation?: 'success';
}

interface NoticeContextValue {
  showNotice: (request: NoticeRequest) => void;
  showToast: (message: string, tone?: FloatingToastTone) => void;
}

const NoticeContext = createContext<NoticeContextValue | null>(null);

const toneStyles: Record<NoticeTone, { accent: string }> = {
  info: { accent: 'border-brand-light' },
  success: { accent: 'border-success' },
  warning: { accent: 'border-warning' },
  danger: { accent: 'border-danger' },
};

export function NoticeProvider({ children }: React.PropsWithChildren): React.JSX.Element {
  const [notice, setNotice] = useState<NoticeRequest | null>(null);
  const [toast, setToast] = useState<FloatingToastMessage | null>(null);
  const toastId = useRef(0);
  const showNotice = useCallback((request: NoticeRequest): void => setNotice(request), []);
  const showToast = useCallback((message: string, tone: FloatingToastTone = 'success'): void => {
    toastId.current += 1;
    setToast({ id: toastId.current, message, tone });
  }, []);
  const dismissToast = useCallback((): void => setToast(null), []);
  const value = useMemo(() => ({ showNotice, showToast }), [showNotice, showToast]);

  const tone = toneStyles[notice?.tone ?? 'info'];
  const actions = notice?.actions ?? [{ label: 'Entendido', onPress: () => setNotice(null) }];

  return (
    <NoticeContext.Provider value={value}>
      <View className="flex-1">
        {children}
        <FloatingToast toast={toast} onDismiss={dismissToast} />
      </View>
      <Modal
        animationType="fade"
        transparent
        visible={notice !== null}
        onRequestClose={() => setNotice(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className={`w-full rounded-3xl border-2 bg-surface p-5 ${tone.accent}`}>
            <View className="gap-1">
              {notice?.animation === 'success' ? (
                <LottieState
                  accessibilityLabel="Lectura guardada correctamente"
                  autoPlay
                  loop={false}
                  sizeClassName="h-24 w-24 self-center"
                  source={readingSavedAnimation}
                />
              ) : null}
              <Text className="text-xl font-extrabold text-content">{notice?.title}</Text>
              <Text className="text-sm leading-5 text-content-muted" variant="body">
                {notice?.message}
              </Text>
            </View>
            <View className="mt-5 flex-row justify-end gap-3">
              {actions.map((action) => (
                <Pressable
                  accessibilityRole="button"
                  className={`min-h-11 items-center justify-center rounded-full px-5 ${action.destructive ? 'bg-danger' : 'bg-action'}`}
                  key={action.label}
                  onPress={() => {
                    setNotice(null);
                    action.onPress();
                  }}
                >
                  <Text className={`font-bold ${action.destructive ? 'text-white' : 'text-on-action'}`}>
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </NoticeContext.Provider>
  );
}

export function useNotice(): NoticeContextValue {
  const context = useContext(NoticeContext);
  if (!context) {
    throw new Error('useNotice debe utilizarse dentro de NoticeProvider');
  }
  return context;
}
