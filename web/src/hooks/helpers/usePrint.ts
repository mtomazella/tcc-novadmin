import { useState, useRef, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';

export default function usePrint<T>() {
  const [printData, setPrintData] = useState<T | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Document_${Date.now()}`,
    onAfterPrint: () => setPrintData(null),
  });

  const triggerPrint = useCallback(() => {
    if (printRef.current) {
      handlePrint();
    } else {
      const retryTimer = setTimeout(() => {
        if (printRef.current) {
          handlePrint();
        }
      }, 100);
      
      return () => clearTimeout(retryTimer);
    }
  }, [handlePrint]);

  return {
    printData,
    setPrintData,
    printRef,
    triggerPrint,
  };
}