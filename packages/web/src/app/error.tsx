"use client"; // Error components must be Client Components

import Image from "next/image";
import { useEffect } from "react";
import thisIsFine from "@assets/thisisfine.gif";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div>
      <p className="mt-20 mb-8 text-center">
        Experiencing server errors. Please check back later.
      </p>
      <Image src={thisIsFine} alt="This is fine" className="m-auto" />
    </div>
  );
}
