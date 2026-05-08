export const getValidColumnMappings = (mappings) =>
  mappings
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      ...item,
      sourceColumn:
        typeof item.sourceColumn === 'string'
          ? item.sourceColumn.trim()
          : item.sourceColumn,
      targetField:
        typeof item.targetField === 'string'
          ? item.targetField.trim()
          : item.targetField,
    }))
    .filter((item) => item.sourceColumn && item.targetField);

export const getMissingMandatoryFields = (mappings, importType, mandatoryFieldsByImportType) => {
  const selectedTargetFields = new Set(
    getValidColumnMappings(mappings).map((item) => item.targetField)
  );

  return (mandatoryFieldsByImportType[importType] || []).filter(
    (field) => !selectedTargetFields.has(field.value)
  );
};

