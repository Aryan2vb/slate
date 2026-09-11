import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  SlideInLeft,
  SlideOutLeft,
  SlideInRight,
  SlideOutRight,
  FadeIn,
  FadeOut,
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '../../../components/Icon';
import DeleteConfirmModal from '../../../components/DeleteConfirmModal';
import { fontFamilies } from '../../../theme/tokens';
import { useFolderStore } from '../../../store/useFolderStore';
import { useNoteStore } from '../../../store/useNoteStore';
import { Folder } from '../../../types/notes';

interface FoldersModalProps {
  visible: boolean;
  themeColors: any;
  isDark: boolean;
  onClose: () => void;
}

export default function FoldersModal({
  visible,
  themeColors,
  isDark,
  onClose,
}: FoldersModalProps) {
  const insets = useSafeAreaInsets();
  const folders = useFolderStore((s) => s.folders);
  const selectedFolderId = useFolderStore((s) => s.selectedFolderId);
  const setSelectedFolderId = useFolderStore((s) => s.setSelectedFolderId);
  const createFolder = useFolderStore((s) => s.createFolder);
  const deleteFolder = useFolderStore((s) => s.deleteFolder);

  const notes = useNoteStore((s) => s.notes);

  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

  // Expandable search bar state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  const SCREEN_WIDTH = Dimensions.get('window').width;
  const translateX = useSharedValue(-SCREEN_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateX.value = -SCREEN_WIDTH;
      backdropOpacity.value = 0;
      translateX.value = withTiming(0, {
        duration: 380,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });
      backdropOpacity.value = withTiming(1, {
        duration: 350,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });
    }
  }, [visible]);

  const animatedSlideStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const animatedBackdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  const handleCloseWithAnimation = () => {
    void Haptics.selectionAsync();
    backdropOpacity.value = withTiming(0, { duration: 240 });
    translateX.value = withTiming(
      -SCREEN_WIDTH,
      { duration: 280, easing: Easing.bezier(0.25, 1, 0.5, 1) },
      () => {
        runOnJS(onClose)();
      }
    );
  };

  // Hardware back press on Android closes with smooth left slide
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleCloseWithAnimation();
      return true;
    });
    return () => sub.remove();
  }, [visible]);

  // Swipe-to-close gesture: reliable horizontal swipe capture that ScrollView cannot cancel
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 8 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 8 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.value = gestureState.dx;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -30 || gestureState.vx < -0.25) {
          handleCloseWithAnimation();
        } else {
          translateX.value = withSpring(0, { damping: 22, stiffness: 220 });
        }
      },
      onPanResponderTerminate: () => {
        translateX.value = withSpring(0, { damping: 22, stiffness: 220 });
      },
    })
  ).current;

  const handleSelectFolder = (folderId: string | null) => {
    void Haptics.selectionAsync();
    setSelectedFolderId(folderId);
    handleCloseWithAnimation();
  };

  const handleCreate = () => {
    if (!newFolderName.trim()) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    createFolder(newFolderName.trim(), newFolderDesc.trim());
    setNewFolderName('');
    setNewFolderDesc('');
    setIsCreating(false);
  };

  const handleDeleteFolder = (folder: Folder) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFolderToDelete(folder);
  };

  const getFolderNoteCount = (folderId: string) => {
    return notes.filter((n) => n.folderId === folderId).length;
  };

  // Filtered folders based on search query
  const displayedFolders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q))
    );
  }, [folders, searchQuery]);

  if (!visible && !folderToDelete) return null;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={handleCloseWithAnimation}
      >
      <Animated.View style={[styles.overlay, animatedBackdropStyle]}>
        <Animated.View
          style={[
            styles.fullSlideOver,
            {
              backgroundColor: themeColors.bg,
              paddingTop: insets.top,
              paddingBottom: insets.bottom + 16,
            },
            animatedSlideStyle,
          ]}
          {...panResponder.panHandlers}
        >
          <StatusBar barStyle={themeColors.barStyle} backgroundColor={themeColors.bg} />

          {/* Top Header Bar */}
          <View
            style={[
              styles.topBar,
              {
                borderBottomColor: themeColors.divider,
                backgroundColor: themeColors.bg,
              },
            ]}
          >
            {isSearchOpen ? (
              /* Expandable search input expanding from right to left */
              <Animated.View
                entering={SlideInRight.duration(220).easing(Easing.bezier(0.22, 1, 0.36, 1))}
                exiting={SlideOutRight.duration(160).easing(Easing.bezier(0.22, 1, 0.36, 1))}
                style={styles.expandedSearchContainer}
              >
                <View
                  style={[
                    styles.searchInputBox,
                    {
                      backgroundColor: themeColors.card,
                      borderColor: themeColors.cardBorder,
                    },
                  ]}
                >
                  <Icon name="search" size={16} color={themeColors.textSecondary} />
                  <TextInput
                    ref={searchInputRef}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search folders..."
                    placeholderTextColor={themeColors.textMuted}
                    style={[styles.searchInput, { color: themeColors.text }]}
                    autoFocus
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.searchClearBtn}
                    >
                      <Icon name="x" size={14} color={themeColors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  style={styles.cancelSearchBtn}
                >
                  <Text style={[styles.cancelSearchText, { color: themeColors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              /* Normal Top Bar: Leftmost Folders Title + Search & New (+) on right */
              <View style={styles.topBarMainRow}>
                {/* Leftmost Folders Title: tap or swipe left to go back to main page */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleCloseWithAnimation}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 16 }}
                >
                  <Animated.Text
                    entering={FadeIn.duration(200)}
                    style={[styles.headerTitle, { color: themeColors.text }]}
                  >
                    Folders
                  </Animated.Text>
                </TouchableOpacity>

                <View style={styles.topBarRightIcons}>
                  {/* Search icon button */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setIsSearchOpen(true);
                    }}
                    style={[
                      styles.iconCircleBtn,
                      { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
                    ]}
                  >
                    <Icon name="search" size={17} color={themeColors.textSecondary} />
                  </TouchableOpacity>

                  {/* Create New Folder icon button (only icon, no text) */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setIsCreating((prev) => !prev);
                    }}
                    style={[
                      styles.iconCircleBtn,
                      {
                        backgroundColor: isCreating ? themeColors.pillBg : themeColors.buttonBg,
                        borderColor: isCreating ? themeColors.cardBorder : themeColors.buttonBg,
                      },
                    ]}
                  >
                    <Icon
                      name={isCreating ? 'x' : 'plus'}
                      size={18}
                      color={isCreating ? themeColors.text : themeColors.buttonText}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Inline Create Form (When Active) */}
              {isCreating && (
                <View
                  style={[
                    styles.createFormCard,
                    {
                      backgroundColor: themeColors.card,
                      borderColor: themeColors.cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.formHeader, { color: themeColors.text }]}>
                    Create a new folder
                  </Text>
                  <Text style={[styles.formSubtitle, { color: themeColors.textMuted }]}>
                    Group your meeting notes and context by topic or project.
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
                    placeholder="Folder name (e.g. Hiring, Sprint, Clients)"
                    placeholderTextColor={themeColors.textMuted}
                    value={newFolderName}
                    onChangeText={setNewFolderName}
                    autoFocus
                  />

                  <TextInput
                    style={[
                      styles.input,
                      styles.multilineInput,
                      {
                        color: themeColors.text,
                        borderColor: themeColors.cardBorder,
                        backgroundColor: themeColors.bg,
                      },
                    ]}
                    placeholder="Folder description or context (optional)"
                    placeholderTextColor={themeColors.textMuted}
                    value={newFolderDesc}
                    onChangeText={setNewFolderDesc}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={styles.formButtonRow}>
                    <TouchableOpacity
                      onPress={() => {
                        setIsCreating(false);
                        setNewFolderName('');
                        setNewFolderDesc('');
                      }}
                      style={[styles.cancelBtn, { borderColor: themeColors.cardBorder }]}
                    >
                      <Text style={[styles.cancelBtnText, { color: themeColors.textSecondary }]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleCreate}
                      disabled={!newFolderName.trim()}
                      style={[
                        styles.submitBtn,
                        {
                          backgroundColor: themeColors.buttonBg,
                          opacity: newFolderName.trim() ? 1 : 0.45,
                        },
                      ]}
                    >
                      <Text style={[styles.submitBtnText, { color: themeColors.buttonText }]}>
                        Save folder
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Empty Search Result Hint */}
              {displayedFolders.length === 0 && searchQuery.trim().length > 0 && (
                <View style={styles.emptyContainer}>
                  <Icon name="search" size={32} color={themeColors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                    No folders match "{searchQuery.trim()}"
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={styles.clearSearchTextBtn}
                  >
                    <Text style={[styles.clearSearchActionText, { color: themeColors.textSecondary }]}>
                      Clear search
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Empty Folders Hint */}
              {folders.length === 0 && !isCreating && (
                <View style={styles.emptyContainer}>
                  <Icon name="folder" size={36} color={themeColors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                    No folders yet
                  </Text>
                  <Text style={[styles.emptyDesc, { color: themeColors.textMuted }]}>
                    Create folders to organize your client calls, 1-on-1s, and projects.
                  </Text>
                </View>
              )}

              {/* List of Folders */}
              {displayedFolders.map((folder) => {
                const count = getFolderNoteCount(folder.id);
                const isSelected = selectedFolderId === folder.id;

                return (
                  <TouchableOpacity
                    key={folder.id}
                    activeOpacity={0.75}
                    onPress={() => handleSelectFolder(folder.id)}
                    onLongPress={() => handleDeleteFolder(folder)}
                    style={[
                      styles.folderCard,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(255,255,255,0.08)'
                            : '#F3F2EE'
                          : themeColors.card,
                        borderColor:
                          isSelected ? themeColors.text : themeColors.cardBorder,
                      },
                    ]}
                  >
                    <View style={styles.cardLeft}>
                      <View
                        style={[
                          styles.iconCircle,
                          { backgroundColor: themeColors.pillBg },
                        ]}
                      >
                        <Icon name="folder" size={17} color={themeColors.text} />
                      </View>

                      <View style={styles.folderTextContainer}>
                        <Text
                          style={[styles.folderCardTitle, { color: themeColors.text }]}
                          numberOfLines={1}
                        >
                          {folder.name}
                        </Text>
                        {folder.description ? (
                          <Text
                            style={[styles.folderCardDesc, { color: themeColors.textMuted }]}
                            numberOfLines={2}
                          >
                            {folder.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.cardRight}>
                      <View style={[styles.pillCount, { backgroundColor: themeColors.pillBg }]}>
                        <Text style={[styles.noteCountText, { color: themeColors.textSecondary }]}>
                          {count} {count === 1 ? 'note' : 'notes'}
                        </Text>
                      </View>

                      {isSelected && (
                        <View style={[styles.checkCircle, { backgroundColor: themeColors.text }]}>
                          <Icon name="check" size={12} color={themeColors.bg} />
                        </View>
                      )}

                      <TouchableOpacity
                        onPress={() => handleDeleteFolder(folder)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.deleteBtn}
                      >
                        <Icon name="trash-2" size={15} color={themeColors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>
    </Modal>

    {/* Bespoke Delete Folder Confirmation */}
    <DeleteConfirmModal
      visible={!!folderToDelete}
      title="Delete Folder"
      message={
        folderToDelete
          ? `Are you sure you want to delete "${folderToDelete.name}"? Notes inside will not be deleted.`
          : ''
      }
      confirmLabel="Delete"
      cancelLabel="Cancel"
      onConfirm={() => {
        if (folderToDelete) {
          deleteFolder(folderToDelete.id);
          setFolderToDelete(null);
        }
      }}
      onCancel={() => setFolderToDelete(null)}
    />
  </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  fullSlideOver: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  topBarMainRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
    fontFamily: fontFamilies.serif,
  },
  topBarRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    fontFamily: fontFamilies.sans,
  },
  searchClearBtn: {
    padding: 4,
  },
  cancelSearchBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  cancelSearchText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamilies.sans,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 40,
  },
  sectionHeaderRow: {
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: fontFamilies.sans,
  },
  folderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderTextContainer: {
    flex: 1,
  },
  folderCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    fontFamily: fontFamilies.serif,
  },
  folderCardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
    fontFamily: fontFamilies.sans,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pillCount: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  noteCountText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontFamilies.sans,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    padding: 4,
  },
  createFormCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  formHeader: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
    fontFamily: fontFamilies.serif,
  },
  formSubtitle: {
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18,
    fontFamily: fontFamilies.sans,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
    fontFamily: fontFamilies.sans,
  },
  multilineInput: {
    height: 76,
    textAlignVertical: 'top',
  },
  formButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamilies.sans,
  },
  submitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fontFamilies.sans,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    fontFamily: fontFamilies.sans,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    fontFamily: fontFamilies.sans,
  },
  createFirstBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  createFirstBtnText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fontFamilies.sans,
  },
  clearSearchTextBtn: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearSearchActionText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fontFamilies.sans,
  },
});
