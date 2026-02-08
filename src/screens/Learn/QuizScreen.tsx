import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import type { LearnStackParamList } from '../../navigation/types';
import type { WasteType } from '../../utils/types';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { NavHeader } from '../../components/NavHeader';
import { Screen } from '../../components/Screen';
import { QUIZ_QUESTIONS } from '../../data/learnContent';
import { useAppDispatch, useAppState } from '../../state/AppStateProvider';
import { spacing } from '../../theme/tokens';
import { createId } from '../../utils/id';
import { getBinInfo } from '../../utils/waste';
import { notify } from '../../utils/haptics';

type Props = NativeStackScreenProps<LearnStackParamList, 'Quiz'>;

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

const OPTIONS: Exclude<WasteType, 'unknown'>[] = [
  'plastic',
  'paper',
  'glass',
  'metal',
  'battery',
];

export function QuizScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { settings } = useAppState();

  const questions = useMemo(() => shuffle(QUIZ_QUESTIONS).slice(0, 5), []);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Exclude<WasteType, 'unknown'> | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const q = questions[index];
  const previewCorrectCount =
    correctCount + (revealed && picked && picked === q.correctWasteType ? 1 : 0);

  const choose = async (wasteType: Exclude<WasteType, 'unknown'>) => {
    if (picked) return;
    setPicked(wasteType);
  };

  const advance = async () => {
    if (!picked) {
      Alert.alert('Bir cevap seçin', 'Öğeye uygun kutuyu seçin.');
      return;
    }

    const isCorrect = picked === q.correctWasteType;
    if (!revealed) {
      setRevealed(true);
      await notify(
        settings.hapticsEnabled,
        isCorrect ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
      );
      return;
    }

    const nextCorrectCount = correctCount + (isCorrect ? 1 : 0);
    if (index === questions.length - 1) {
      if (submitted) return;
      setSubmitted(true);
      setCorrectCount(nextCorrectCount);
      const completedAt = new Date().toISOString();
      dispatch({
        type: 'COMPLETE_QUIZ',
        payload: {
          session: {
            id: createId('quiz'),
            completedAt,
            correct: nextCorrectCount,
            total: questions.length,
          },
        },
      });
      navigation.goBack();
      return;
    }

    setCorrectCount(nextCorrectCount);
    setPicked(null);
    setRevealed(false);
    setIndex((i) => i + 1);
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <NavHeader title="Quiz" onBack={() => navigation.goBack()} />

        <Card>
          <AppText variant="subtitle">Bu hangi kutuya ait?</AppText>
          <AppText variant="caption" tone="muted" style={styles.topSpace}>
            Soru {index + 1} / {questions.length}
          </AppText>

          <AppText variant="title" style={styles.question}>
            {q.item}
          </AppText>

          <View style={styles.options}>
            {OPTIONS.map((t) => (
              <Chip
                key={t}
                label={`${getBinInfo(t).binColorName} (${getBinInfo(t).wasteLabel})`}
                selected={picked === t}
                onPress={() => choose(t)}
              />
            ))}
          </View>

          {revealed ? (
            <View style={styles.feedback}>
              <AppText variant="label">
                {picked === q.correctWasteType ? 'Doğru' : 'Yanlış'}
              </AppText>
              <AppText tone="muted" style={styles.topSpace}>
                {q.explanation}
              </AppText>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Button
              title={
                !picked
                  ? 'Onayla'
                  : !revealed
                    ? 'Onayla'
                    : index === questions.length - 1
                      ? 'Bitir'
                      : 'İleri'
              }
              onPress={() => void advance()}
              disabled={!picked || submitted}
            />
          </View>
        </Card>

        <Card>
          <AppText variant="subtitle">Puan</AppText>
          <AppText tone="muted" style={styles.topSpace}>
            Doğru sayısı: {previewCorrectCount} / {questions.length}
          </AppText>
          <AppText variant="caption" tone="muted" style={styles.topSpace}>
            Her doğru cevap için 1 puan kazanırsın.
          </AppText>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  topSpace: { marginTop: spacing.sm },
  question: { marginTop: spacing.lg },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  feedback: { marginTop: spacing.lg },
  actions: { marginTop: spacing.lg },
});
