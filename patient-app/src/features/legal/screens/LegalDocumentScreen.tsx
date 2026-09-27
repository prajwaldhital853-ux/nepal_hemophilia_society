import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { StackScreenProps } from "@react-navigation/stack";

import type { RootStackParamList } from "@/core/navigation/types";
import { legalDocuments, type LegalDocumentId } from "@/features/legal/content";

type Props = StackScreenProps<RootStackParamList, "Legal">;

export default function LegalDocumentScreen({ route }: Props) {
  const documentId: LegalDocumentId = route.params.document;
  const document = legalDocuments[documentId];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{document.title}</Text>
      <Text style={styles.updated}>Last updated: {document.updated}</Text>
      <Text style={styles.intro}>{document.intro}</Text>
      {document.sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <Text style={styles.heading}>{section.heading}</Text>
          {section.paragraphs.map((paragraph) => (
            <Text key={paragraph} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 48,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "500",
    color: "#202124",
  },
  updated: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: "#5F6368",
  },
  intro: {
    marginTop: 20,
    fontSize: 15,
    lineHeight: 24,
    color: "#3C4043",
  },
  section: {
    marginTop: 28,
  },
  heading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "500",
    color: "#202124",
  },
  paragraph: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 24,
    color: "#3C4043",
  },
});
