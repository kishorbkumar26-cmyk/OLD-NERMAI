import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { CourseApi } from '@nermai/api';
import { BottomSheetForm } from '../../components/admin/BottomSheetForm';
import { TextField } from '../../components/ui/TextField';

interface SubjectFormSheetProps {
  visible: boolean;
  onClose: () => void;
  courseId: string;
  existingSubject?: any;
  onSuccess: () => void;
}

export const SubjectFormSheet = ({ visible, onClose, courseId, existingSubject, onSuccess }: SubjectFormSheetProps) => {
  const isEditing = !!existingSubject;
  
  const [name, setName] = useState('');
  const [sequenceIndex, setSequenceIndex] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (isEditing) {
        setName(existingSubject.name || existingSubject.title || '');
        setSequenceIndex(String(existingSubject.sequenceIndex || 0));
      } else {
        setName('');
        setSequenceIndex('0');
      }
    }
  }, [visible, isEditing, existingSubject]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Subject name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name,
        sequenceIndex: parseInt(sequenceIndex) || 0
      };

      if (isEditing) {
        await CourseApi.updateSubject(existingSubject.id, payload);
      } else {
        await CourseApi.createSubject(courseId, payload);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save subject', error);
      Alert.alert('Error', 'Failed to save subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheetForm
      visible={visible}
      onClose={onClose}
      title={isEditing ? 'Edit Subject' : 'New Subject'}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? 'Save Changes' : 'Create Subject'}
      isSubmitting={isSubmitting}
    >
      <TextField
        label="Subject Name"
        placeholder="e.g. Mathematics"
        value={name}
        onChangeText={setName}
      />
      
      <TextField
        label="Sequence Index"
        placeholder="e.g. 0, 1, 2"
        keyboardType="number-pad"
        value={sequenceIndex}
        onChangeText={setSequenceIndex}
      />
    </BottomSheetForm>
  );
};
