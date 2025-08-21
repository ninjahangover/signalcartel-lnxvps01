import { useState, useEffect } from 'react';
import PineScriptManager, { PineScriptAlert, WebhookConfig } from '../pine-script-manager';

export function usePineScript() {
  const [webhookConfigs, setWebhookConfigs] = useState<WebhookConfig[]>([]);
  const [alertHistory, setAlertHistory] = useState<PineScriptAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const manager = PineScriptManager.getInstance();

    const updateData = () => {
      setWebhookConfigs(manager.getAllWebhookConfigs());
      setAlertHistory(manager.getAlertHistory());
    };

    // Initial load
    updateData();

    // Subscribe to changes
    const unsubscribe = manager.subscribe(updateData);

    return unsubscribe;
  }, []);

  const generateWebhookUrl = (strategyId: string) => {
    const manager = PineScriptManager.getInstance();
    return manager.generateWebhookUrl(strategyId);
  };

  const configureWebhook = async (strategyId: string, strategy: any) => {
    const manager = PineScriptManager.getInstance();
    return await manager.configureWebhook(strategyId, strategy);
  };

  const generatePineScriptAlert = (strategyId: string) => {
    const manager = PineScriptManager.getInstance();
    return manager.generatePineScriptAlert(strategyId);
  };

  const testStrategy = async (strategyId: string, testAlert: Record<string, any>) => {
    setIsLoading(true);
    try {
      const manager = PineScriptManager.getInstance();
      const result = await manager.testStrategy(strategyId, testAlert);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWebhook = (strategyId: string, active: boolean) => {
    const manager = PineScriptManager.getInstance();
    manager.toggleWebhook(strategyId, active);
  };

  const toggleTestMode = (strategyId: string, testMode: boolean) => {
    const manager = PineScriptManager.getInstance();
    manager.toggleTestMode(strategyId, testMode);
  };

  const updateWebhookPayload = (strategyId: string, payload: Record<string, any>) => {
    const manager = PineScriptManager.getInstance();
    manager.updateWebhookPayload(strategyId, payload);
  };

  const getWebhookConfig = (strategyId: string) => {
    const manager = PineScriptManager.getInstance();
    return manager.getWebhookConfig(strategyId);
  };

  const getAlertHistory = (strategyId?: string) => {
    const manager = PineScriptManager.getInstance();
    return manager.getAlertHistory(strategyId);
  };

  return {
    webhookConfigs,
    alertHistory,
    isLoading,
    generateWebhookUrl,
    configureWebhook,
    generatePineScriptAlert,
    testStrategy,
    toggleWebhook,
    toggleTestMode,
    updateWebhookPayload,
    getWebhookConfig,
    getAlertHistory
  };
}