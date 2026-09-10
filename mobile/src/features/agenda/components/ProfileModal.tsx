import React from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import Icon from '../../../components/Icon';

interface ProfileModalProps {
  visible: boolean;
  authUser: { email?: string; name?: string; picture?: string } | null;
  onSync: () => void;
  onSignOut: () => void;
  onClose: () => void;
}

export default function ProfileModal({
  visible,
  authUser,
  onSync,
  onSignOut,
  onClose,
}: ProfileModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.profileOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                {authUser?.picture ? (
                  <Image source={{ uri: authUser.picture }} style={styles.profileLargeAvatar} />
                ) : (
                  <View style={styles.profileLargeAvatarFallback}>
                    <Text style={styles.profileLargeAvatarText}>
                      {(authUser?.name || authUser?.email || 'U')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.profileName}>
                  {authUser?.name || 'Google Account'}
                </Text>
                <Text style={styles.profileEmail}>{authUser?.email}</Text>
              </View>

              <TouchableOpacity style={styles.profileSyncBtn} onPress={onSync}>
                <Icon name="refresh-cw" size={14} color="#D1D5DB" />
                <Text style={styles.profileSyncText}>Sync Calendar Events</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileSignOutBtn} onPress={onSignOut}>
                <Text style={styles.profileSignOutText}>Sign out</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileCloseBtn} onPress={onClose}>
                <Text style={styles.profileCloseText}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  profileOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  profileCard: {
    width: '100%',
    backgroundColor: '#202125',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2F3138',
    padding: 24,
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileLargeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12,
  },
  profileLargeAvatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2F3138',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileLargeAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
    color: '#8E929B',
  },
  profileSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#2A2B31',
    borderRadius: 999,
    marginBottom: 12,
  },
  profileSyncText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  profileSignOutBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  profileSignOutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  profileCloseBtn: {
    paddingVertical: 10,
  },
  profileCloseText: {
    fontSize: 14,
    color: '#8E929B',
  },
});
