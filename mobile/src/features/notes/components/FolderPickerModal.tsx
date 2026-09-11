import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import Icon from '../../../components/Icon';
import { fontFamilies } from '../../../theme/tokens';
import { useFolderStore } from '../../../store/useFolderStore';
import { Folder } from '../../../types/notes';

interface FolderPickerModalProps {
  visible: boolean;
  selectedFolderId?: string;
  themeColors: any;
  isDark: boolean;
  onSelectFolder: (folder?: Folder) => void;
  onClose: () => void;
}

export default function FolderPickerModal({
  visible,
  selectedFolderId,
  themeColors,
  isDark,
  onSelectFolder,
  onClose,
}: FolderPickerModalProps) {
  const folders = useFolderStore((s) => s.folders);
  const createFolder = useFolderStore((s) => s.createFolder);

  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');

  const handleCreate = () => {
    if (!newFolderName.trim()) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const created = createFolder(newFolderName.trim(), newFolderDesc.trim());
    setNewFolderName('');
    setNewFolderDesc('');
    setIsCreating(false);
    onSelectFolder(created);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={[
                styles.sheetContainer,
                {
                  backgroundColor: isDark ? '#1C1D22' : '#FFFFFF',
                  borderColor: themeColors.cardBorder,
                },
              ]}
            >
              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  <Icon name="folder" size={18} color={themeColors.text} />
                  <Text style={[styles.headerTitle, { color: themeColors.text }]}>
                    Add note to folder
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[styles.closeBtn, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}
                >
                  <Icon name="x" size={15} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Option: No Folder */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    onSelectFolder(undefined);
                    onClose();
                  }}
                  style={[
                    styles.folderItem,
                    {
                      backgroundColor:
                        !selectedFolderId
                          ? isDark
                            ? 'rgba(255,255,255,0.08)'
                            : '#F3F2EE'
                          : 'transparent',
                      borderColor: themeColors.cardBorder,
                    },
                  ]}
                >
                  <View style={styles.folderLeft}>
                    <Icon name="slash" size={16} color={themeColors.textMuted} />
                    <Text style={[styles.folderName, { color: themeColors.text }]}>
                      No folder (Unassigned)
                    </Text>
                  </View>
                  {!selectedFolderId && (
                    <Icon name="check" size={16} color={themeColors.text} />
                  )}
                </TouchableOpacity>

                {/* Available Folders */}
                {folders.map((folder) => {
                  const isSelected = selectedFolderId === folder.id;
                  return (
                    <TouchableOpacity
                      key={folder.id}
                      activeOpacity={0.7}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        onSelectFolder(folder);
                        onClose();
                      }}
                      style={[
                        styles.folderItem,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(255,255,255,0.08)'
                              : '#F3F2EE'
                            : 'transparent',
                          borderColor: themeColors.cardBorder,
                        },
                      ]}
                    >
                      <View style={styles.folderLeft}>
                        <Icon name="folder" size={16} color={themeColors.text} />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[styles.folderName, { color: themeColors.text }]}
                            numberOfLines={1}
                          >
                            {folder.name}
                          </Text>
                          {folder.description ? (
                            <Text
                              style={[styles.folderDesc, { color: themeColors.textMuted }]}
                              numberOfLines={1}
                            >
                              {folder.description}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      {isSelected && (
                        <Icon name="check" size={16} color={themeColors.text} />
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Create inline form */}
                {isCreating ? (
                  <View
                    style={[
                      styles.createForm,
                      {
                        backgroundColor: themeColors.card,
                        borderColor: themeColors.cardBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.formTitle, { color: themeColors.text }]}>
                      New folder
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: themeColors.text,
                          borderColor: themeColors.cardBorder,
                          backgroundColor: themeColors.bg,
                        },
                      ]}
                      placeholder="Folder name"
                      placeholderTextColor={themeColors.textMuted}
                      value={newFolderName}
                      onChangeText={setNewFolderName}
                      autoFocus
                    />
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: themeColors.text,
                          borderColor: themeColors.cardBorder,
                          backgroundColor: themeColors.bg,
                        },
                      ]}
                      placeholder="Description (optional)"
                      placeholderTextColor={themeColors.textMuted}
                      value={newFolderDesc}
                      onChangeText={setNewFolderDesc}
                    />

                    <View style={styles.formActions}>
                      <TouchableOpacity
                        onPress={() => setIsCreating(false)}
                        style={[styles.btnSecondary, { borderColor: themeColors.cardBorder }]}
                      >
                        <Text style={[styles.btnSecondaryText, { color: themeColors.textSecondary }]}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleCreate}
                        disabled={!newFolderName.trim()}
                        style={[
                          styles.btnPrimary,
                          {
                            backgroundColor: themeColors.buttonBg,
                            opacity: newFolderName.trim() ? 1 : 0.5,
                          },
                        ]}
                      >
                        <Text style={[styles.btnPrimaryText, { color: themeColors.buttonText }]}>
                          Create & Select
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setIsCreating(true)}
                    style={[
                      styles.addFolderBtn,
                      {
                        borderColor: themeColors.cardBorder,
                        backgroundColor: themeColors.card,
                      },
                    ]}
                  >
                    <Icon name="plus" size={15} color={themeColors.text} />
                    <Text style={[styles.addFolderText, { color: themeColors.text }]}>
                      Create new folder
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '75%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    maxHeight: 350,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  folderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  folderName: {
    fontSize: 14,
    fontWeight: '600',
  },
  folderDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  addFolderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 6,
  },
  addFolderText: {
    fontSize: 13,
    fontWeight: '600',
  },
  createForm: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 6,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 8,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  btnSecondary: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  btnSecondaryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  btnPrimary: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnPrimaryText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
