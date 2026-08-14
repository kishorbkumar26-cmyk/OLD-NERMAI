import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { CourseApi } from '@nermai/api';
import { BottomSheetForm } from '../../components/admin/BottomSheetForm';
import { TextField } from '../../components/ui/TextField';

interface TopicFormSheetProps {
  visible: boolean;
  onClose: () => void;
  subjectId: string;
  existingTopic?: any;
  onSuccess: () => void;
}

export const TopicFormSheet = ({ visible, onClose, subjectId, existingTopic, onSuccess }: TopicFormSheetProps) => {
  const isEditing = !!existingTopic;
  
  const [name, setName] = useState('');
  const [sequenceIndex, setSequenceIndex] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (isEditing) {
        setName(existingTopic.name || existingTopic.title || '');
        setSequenceIndex(String(existingTopic.sequenceIndex || 0));
      } else {
        setName('');
        setSequenceIndex('0');
      }
    }
  }, [visible, isEditing, existingTopic]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Topic name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name,
        sequenceIndex: parseInt(sequenceIndex) || 0
      };

      if (isEditing) {
        await CourseApi.updateTopic(existingTopic.id, payload);
      } else {
        await CourseApi.createTopic(subjectId, payload);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save topic', error);
      Alert.alert('Error', 'Failed to save topic.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheetForm
      visible={visible}
      onClose={onClose}
      title={isEditing ? 'Edit Topic' : 'New Topic'}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? 'Save Changes' : 'Create Topic'}
      isSubmitting={isSubmitting}
    >
      <TextField
        label="Topic Name"
        placeholder="e.g. Introduction to Algebra"
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
