import { LoadingState, MutableDataFrame, PanelData } from '@grafana/data';
import { PanelRenderer } from '@grafana/runtime';
import { FieldColor, FieldColorModeId } from '@grafana/schema';
import styles from '@pyroscope/pages/tagExplorer/components/TotalSamplesChart/PieChart/styles.module.scss';
import { stringifyPyroscopeColor } from '@shared/domain/translation';
import { PieChartProps } from 'grafana-pyroscope/public/app/pages/tagExplorer/components/TotalSamplesChart/PieChart';
import React, { useContext, useMemo } from 'react';

import { PyroscopeStateContext } from '../../../../../../pages/TagExplorer/PyroscopeState/context';

const PieChart = ({ data, width, height }: PieChartProps) => {
  const series = useMemo(() => {
    return data.map((item) => {
      const dataframe = new MutableDataFrame();
      const { data: samples, label } = item;
      dataframe.name = item.label;
      dataframe.addField({ name: 'label' });

      const color: FieldColor = {
        fixedColor: stringifyPyroscopeColor(item.color),
        mode: FieldColorModeId.Fixed,
      };

      dataframe.addField({ name: 'total', config: { color } });

      dataframe.appendRow([label, samples]);

      return dataframe;
    });
  }, [data]);

  const { timeRange } = useContext(PyroscopeStateContext);

  const panelData: PanelData = {
    series,
    timeRange,
    state: LoadingState.Done,
  };

  return (
    <div className={styles.wrapper}>
      <PanelRenderer
        pluginId="piechart"
        title=""
        data={panelData}
        width={parseInt(width, 10)}
        height={parseInt(height, 10)}
      />
    </div>
  );
};

export default PieChart;
