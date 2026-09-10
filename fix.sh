#!/bin/bash
sed -i '2,3d' src/components/SupabaseRbacModal.tsx
sed -i '2iimport { getStoredEvalElements, saveStoredEvalElements } from "../utils/evalElements";' src/components/SupabaseRbacModal.tsx
