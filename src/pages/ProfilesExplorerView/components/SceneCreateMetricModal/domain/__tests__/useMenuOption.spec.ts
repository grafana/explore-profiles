import { act, renderHook } from '@testing-library/react';

import { useCreateRecordingRulesMenu } from '../useMenuOption';

describe('useCreateRecordingRulesMenu', () => {
  let mockSetModalOpen: jest.Mock;

  beforeEach(() => {
    mockSetModalOpen = jest.fn();
  });

  it('should return recording rules menu actions', () => {
    const { result } = renderHook(() => useCreateRecordingRulesMenu(mockSetModalOpen));

    expect(result.current.data).toEqual({});
    expect(result.current.actions.getExtraFlameGraphMenuItems).toBeInstanceOf(Function);
  });

  describe('getExtraFlameGraphMenuItems', () => {
    it('should return create recording rule menu item for any flame graph item', () => {
      const { result } = renderHook(() => useCreateRecordingRulesMenu(mockSetModalOpen));

      const mockItem = {
        level: 1,
        itemIndexes: [0],
      };

      const mockData = {
        fields: [
          {
            name: 'label',
            config: {
              type: {
                enum: {
                  text: ['main.processRequest', 'other.function'],
                },
              },
            },
          },
        ],
      };

      const menuItems = result.current.actions.getExtraFlameGraphMenuItems({ item: mockItem }, mockData);

      expect(menuItems).toHaveLength(1);
      expect(menuItems[0]).toEqual({
        label: 'Create recording rule',
        icon: 'download-alt',
        onClick: expect.any(Function),
      });
    });

    it('should extract function name from flame graph item', () => {
      const { result } = renderHook(() => useCreateRecordingRulesMenu(mockSetModalOpen));

      const mockItem = {
        level: 1,
        itemIndexes: [1], // Index 1 should get 'other.function'
      };

      const mockData = {
        fields: [
          {
            name: 'label',
            config: {
              type: {
                enum: {
                  text: ['main.processRequest', 'other.function'],
                },
              },
            },
          },
        ],
      };

      const menuItems = result.current.actions.getExtraFlameGraphMenuItems({ item: mockItem }, mockData);

      act(() => {
        menuItems[0].onClick();
      });

      expect(mockSetModalOpen).toHaveBeenCalledWith('other.function');
    });

    it('should call setModalOpen with undefined when no function name is available', () => {
      const { result } = renderHook(() => useCreateRecordingRulesMenu(mockSetModalOpen));

      const mockItem = {
        level: 0,
        itemIndexes: [],
      };

      const mockData = {
        fields: [
          {
            name: 'other',
          },
        ],
      };

      const menuItems = result.current.actions.getExtraFlameGraphMenuItems({ item: mockItem }, mockData);

      act(() => {
        menuItems[0].onClick();
      });

      expect(mockSetModalOpen).toHaveBeenCalledWith(undefined);
    });

    it('should handle missing label field gracefully', () => {
      const { result } = renderHook(() => useCreateRecordingRulesMenu(mockSetModalOpen));

      const mockItem = {
        level: 1,
        itemIndexes: [0],
      };

      const mockData = {
        fields: [], // No label field
      };

      const menuItems = result.current.actions.getExtraFlameGraphMenuItems({ item: mockItem }, mockData);

      act(() => {
        menuItems[0].onClick();
      });

      expect(mockSetModalOpen).toHaveBeenCalledWith(undefined);
    });

    it('should handle empty itemIndexes gracefully', () => {
      const { result } = renderHook(() => useCreateRecordingRulesMenu(mockSetModalOpen));

      const mockItem = {
        level: 1,
        itemIndexes: [], // Empty indexes
      };

      const mockData = {
        fields: [
          {
            name: 'label',
            config: {
              type: {
                enum: {
                  text: ['main.processRequest'],
                },
              },
            },
          },
        ],
      };

      const menuItems = result.current.actions.getExtraFlameGraphMenuItems({ item: mockItem }, mockData);

      act(() => {
        menuItems[0].onClick();
      });

      expect(mockSetModalOpen).toHaveBeenCalledWith(undefined);
    });
  });
});
