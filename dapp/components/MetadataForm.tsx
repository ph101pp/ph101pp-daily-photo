import { useRecoilState, useRecoilValue } from "recoil";
import Box from "@mui/material/Box";
import { Accordion, AccordionDetails, AccordionSummary, Button, Typography } from "@mui/material";
import defaultTokenMetadataInputAtom from "./_atoms/defaultTokenMetadataInputAtom";
import { FormContainer, CheckboxElement, TextFieldElement, useFormContext, useForm } from "react-hook-form-mui";
import { useEffect } from "react";
import { MetadataType } from "../utils/getBaseMetadata";


const RenderFormElement = ({
  name,
  label,
  required = false,
  disabled = false
}: {
  name: string,
  label: string,
  required?: boolean,
  disabled?: boolean
}) => {
  const { watch } = useFormContext();
  const enabled = watch(`enable-${name}`, false) as boolean;

  return (
    <Box
      sx={{
        margin: "16px 0",
        display: "flex",
        alignItems: "center"
      }}
    >
      <TextFieldElement fullWidth={true} disabled={disabled && !enabled} name={name} label={label} required={required} />
      {disabled && (
        <Box
          sx={{
            displax: "flex",
            justifyContent: "center",
            alignContent: "center",
            margin: "0px -16px 0 16px"
          }}
        >
          <CheckboxElement name={`enable-${name}`} />
        </Box>
      )}
    </Box>
  );
};

function MetadataForm() {
  const input = useRecoilValue(defaultTokenMetadataInputAtom);
  const { reset } = useFormContext();

  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, []);


  // reset camera settings when image changed
  useEffect(() => {
    reset((data) => {
      return {
        ...data,
        settings: input?.settings ?? data.settings,
        camera: input?.camera ?? data.camera,
      }
    });
  }, [input?.image_details?.sha256]);

  return (
    <Accordion defaultExpanded={true}>
      <AccordionSummary>
        <Typography variant="h6">Update Metadata</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <RenderFormElement name="place" label="Place" required={true} />
        <RenderFormElement name="country" label="Country" required={true} />
        <RenderFormElement name="description" label="Description" required={true} disabled={true} />
        <RenderFormElement name="project" label="Project" required={true} disabled={true} />
        <RenderFormElement name="camera" label="Camera" required={true} disabled={true} />
        <RenderFormElement name="settings" label="Settings" required={true} disabled={true} />
        <Box
          sx={{
            margin: "16px 0"
          }}
        >
          <Button
            fullWidth={true}
            variant="outlined"
            type="submit"
          >
            Update Metadata
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}

export default MetadataForm;