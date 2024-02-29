import { getProfileMetricTitle } from '@pyroscope/pages/TagExplorerView';
import styles from '@pyroscope/pages/TagExplorerView.module.scss';
import { ALL_TAGS, TagsState } from '@pyroscope/redux/reducers/continuous';
import Dropdown, { MenuItem } from '@pyroscope/ui/Dropdown';
import type { ClickEvent } from '@pyroscope/ui/Menu';
import { isPrivateLabel } from '@shared/components/QueryBuilder/domain/helpers/isPrivateLabel';
import React, { useEffect } from 'react';
import type { Maybe } from 'true-myth';

export function ExploreHeader({
  appName,
  whereDropdownItems,
  tags,
  selectedTag,
  selectedTagValue,
  handleGroupByTagChange,
  handleGroupByTagValueChange,
}: {
  appName: Maybe<string>;
  whereDropdownItems: string[];
  tags: TagsState;
  selectedTag: string;
  selectedTagValue: string;
  handleGroupByTagChange: (value: string) => void;
  handleGroupByTagValueChange: (value: string) => void;
}) {
  const tagKeys = Object.keys(tags.tags).filter((tagName) => !isPrivateLabel(tagName));

  const groupByDropdownItems = tagKeys.length > 0 ? tagKeys : ['No tags available'];

  const handleGroupByClick = (e: ClickEvent) => {
    handleGroupByTagChange(e.value);
  };

  const handleGroupByValueClick = (e: ClickEvent) => {
    handleGroupByTagValueChange(e.value);
  };

  useEffect(() => {
    if (tagKeys.length && !selectedTag) {
      handleGroupByTagChange(tagKeys[0]);
    }
  }, [tagKeys, selectedTag, handleGroupByTagChange]);

  return (
    <div className={styles.header} data-testid="explore-header">
      <span className={styles.title}>{getProfileMetricTitle(appName)}</span>
      <div className={styles.queryGrouppedBy}>
        <span className={styles.selectName}>grouped by</span>
        <Dropdown
          label="select tag"
          value={selectedTag ? `tag: ${selectedTag}` : 'select tag'}
          onItemClick={tagKeys.length > 0 ? handleGroupByClick : undefined}
          menuButtonClassName={selectedTag === '' ? styles.notSelectedTagDropdown : undefined}
        >
          {groupByDropdownItems.map((tagName) => (
            <MenuItem key={tagName} value={tagName}>
              {tagName}
            </MenuItem>
          ))}
        </Dropdown>
      </div>
      <div className={styles.query}>
        <span className={styles.selectName}>where</span>
        <Dropdown
          label="select where"
          // eslint-disable-next-line sonarjs/no-nested-template-literals
          value={`${selectedTag ? `${selectedTag} = ` : selectedTag} ${selectedTagValue || ALL_TAGS}`}
          onItemClick={handleGroupByValueClick}
          menuButtonClassName={styles.whereSelectButton}
        >
          {/* always show "All" option */}
          {[ALL_TAGS, ...whereDropdownItems].map((tagGroupName) => (
            <MenuItem key={tagGroupName} value={tagGroupName}>
              {tagGroupName}
            </MenuItem>
          ))}
        </Dropdown>
      </div>
    </div>
  );
}
