import { DataSourcePicker } from '@grafana/runtime';
import { Alert, Button, ConfirmButton, Field, Input, Modal, Stack, Text } from '@grafana/ui';
import React from 'react';
import { useForm } from 'react-hook-form';

import { FunctionVersionOrigin } from '../domain/FunctionVersionContext';
import { FunctionVersion } from '../domain/types/FunctionDetails';

type Props = {
  serviceName: string;
  datasourceName: string;
  datasourceUid: string;
  version?: FunctionVersion;
  functionVersionOrigin?: FunctionVersionOrigin;
  saveOverrides: (datasourceUid: string, serviceName: string, version: FunctionVersion) => void;
  deleteOverride: (datasourceUid: string, serviceName: string) => void;
  deleteAllOverrides: () => void;
};

export const OverrideRepositoryDetailsButton = (props: Props) => {
  const { serviceName, version, datasourceUid, saveOverrides, functionVersionOrigin } = props;
  const [open, setOpen] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FunctionVersion>({ mode: 'onChange' });

  const onSubmit = (data: FunctionVersion) => {
    saveOverrides(datasourceUid, serviceName, {
      repository: data.repository,
      git_ref: data.git_ref || 'HEAD',
      root_path: data.root_path || '',
    });
    setOpen(false);
  };

  return (
    <>
      <Button
        aria-label="override repository settings"
        variant="secondary"
        fill="text"
        size="sm"
        icon="pen"
        onClick={() => {
          setOpen(true);
          reset(version);
        }}
      >
        {functionVersionOrigin === FunctionVersionOrigin.USER ? (
          <Text element="span" color="secondary">
            (user set)
          </Text>
        ) : (
          ''
        )}
      </Button>
      {open && (
        <Modal
          title={
            functionVersionOrigin === FunctionVersionOrigin.USER
              ? 'Edit repository details override'
              : 'Add new repository details override'
          }
          isOpen={open}
          onDismiss={() => setOpen(false)}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <Alert severity="info" title="Github Integration labels">
              <p>
                To activate GitHub Integration feature, you will need to add two new labels when sending profiles:
                <code>service_repository</code> and <code>service_git_ref</code>.
              </p>
              <p>
                For debugging purposes, you can manually provide repository details using this form. The custom value is
                saved in your browser local storage for given data source and service name.
              </p>
            </Alert>

            <Field label="Data source">
              <DataSourcePicker current={datasourceUid} disabled={true}></DataSourcePicker>
            </Field>
            <Field label="Service name">
              <Input disabled={true} value={serviceName}></Input>
            </Field>

            <Field
              label="service_repository (repository URL) - required"
              invalid={!!errors.repository}
              error={errors?.repository?.message?.toString()}
            >
              <Input
                {...register('repository', { required: 'Repository name is required' })}
                placeholder="Enter GitHub repo name, https://github.com/org/repo"
              />
            </Field>
            <Field
              label="service_git_ref (commit reference)"
              invalid={!!errors.git_ref}
              error={errors?.git_ref?.message?.toString()}
            >
              <Input {...register('git_ref')} placeholder="HEAD" />
            </Field>
            <Field label="Path to root">
              <Input {...register('root_path')} placeholder="Enter root path" />
            </Field>

            <Stack direction="row">
              <Button type="submit">{functionVersionOrigin === FunctionVersionOrigin.USER ? 'Edit' : 'Add'}</Button>
              {functionVersionOrigin === FunctionVersionOrigin.USER && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    props.deleteOverride(datasourceUid, serviceName);
                    reset();
                    setOpen(false);
                  }}
                >
                  Delete override
                </Button>
              )}
              <ConfirmButton
                confirmVariant="destructive"
                confirmText="Remove all"
                onConfirm={() => {
                  props.deleteAllOverrides();
                  reset();
                  setOpen(false);
                }}
              >
                Remove all overrides
              </ConfirmButton>
            </Stack>
          </form>
        </Modal>
      )}
    </>
  );
};
