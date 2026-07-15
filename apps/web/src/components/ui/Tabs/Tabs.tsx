'use client';

import React, { useState } from 'react';
import styles from './Tabs.module.css';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  onChange,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (onChange) onChange(tabId);
  };

  return (
    <div className={`${styles.tabsContainer} ${className}`}>
      <div className={styles.tabList} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-trigger-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tab-panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={`${styles.tabTrigger} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.tabContent}>
        {tabs.map((tab) => {
          if (tab.id !== activeTab) return null;
          return (
            <div
              key={tab.id}
              id={`tab-panel-${tab.id}`}
              role="tabpanel"
              aria-labelledby={`tab-trigger-${tab.id}`}
              className={styles.tabPanel}
            >
              {tab.content}
            </div>
          );
        })}
      </div>
    </div>
  );
};
