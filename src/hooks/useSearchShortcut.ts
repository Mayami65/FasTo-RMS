import { useEffect, useCallback, RefObject } from 'react';

/**
 * Hook to focus a search input when the '/' key is pressed
 * @param inputRef Reference to the input element to focus
 */
export function useSearchShortcut(inputRef: RefObject<HTMLInputElement | null>) {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Only trigger if:
        // 1. Key is '/'
        // 2. No input/textarea/select is currently focused
        // 3. No modifier keys are pressed (to avoid interfering with browser shortcuts)

        if (e.key === '/' &&
            !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '') &&
            !e.metaKey && !e.ctrlKey && !e.altKey) {

            e.preventDefault();
            inputRef.current?.focus();
        }
    }, [inputRef]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
