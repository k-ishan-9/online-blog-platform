import { useRef } from 'react';

function useDebounce(func, delay) {
    const timeoutRef = useRef(null);

    return (...args) => {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => func(...args), delay);
    };
}

export default useDebounce;