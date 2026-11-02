import { useRef } from 'react';

// Returns a debounced version of func: each call restarts a `delay` ms timer,
// so func runs only once the calls stop. The timer lives in a ref, so it
// survives re-renders without causing one. Call .cancel() to drop a pending run.
function useDebounce(func, delay) {
    const timeoutRef = useRef(null);

    const debounced = (...args) => {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => func(...args), delay);
    };
    debounced.cancel = () => clearTimeout(timeoutRef.current);

    return debounced;
}

export default useDebounce;
