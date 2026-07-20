import React from 'react';
import { Plus } from 'react-native-feather';
import { QuickMenu } from '../core/MenuBar';

export default function WorldClockAppBar({
  onAdd,
  onOpenSettings,
  onReorder,
  reorderMode = false,
  onDoneReorder,
}) {
  return (
    <QuickMenu
      options={[
        {
          text: 'add',
          onPress: onAdd,
          Icon: <Plus width={20} stroke="white" strokeWidth={3} />,
        },
      ]}
      overflow={[
        { text: 'settings', onPress: onOpenSettings },
        reorderMode
          ? { text: 'done', onPress: onDoneReorder }
          : { text: 'reorder list', onPress: onReorder },
      ]}
    />
  );
}
