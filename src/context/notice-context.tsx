import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';


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
}

interface NoticeContextValue {
  showNotice: (request: NoticeRequest) => void;
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
  const showNotice = useCallback((request: NoticeRequest): void => setNotice(request), []);
  const value = useMemo(() => ({ showNotice }), [showNotice]);

  const tone = toneStyles[notice?.tone ?? 'info'];
  const actions = notice?.actions ?? [{ label: 'Entendido', onPress: () => setNotice(null) }];

  return (
    <NoticeContext.Provider value={value}>
      {children}
      <Modal
        animationType="fade"
        transparent
        visible={notice !== null}
        onRequestClose={() => setNotice(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className={`w-full rounded-3xl border-2 bg-surface p-5 ${tone.accent}`}>
            <View className="gap-1">
              <Text className="text-xl font-extrabold text-content">{notice?.title}</Text>
              <Text className="text-sm leading-5 text-content-muted">{notice?.message}</Text>
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
