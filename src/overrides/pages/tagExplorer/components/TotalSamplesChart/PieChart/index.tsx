import React, { useContext, useMemo } from 'react';
import styles from '@pyroscope/pages/tagExplorer/components/TotalSamplesChart/PieChart/styles.module.scss';
import { PanelRenderer } from '@grafana/runtime';
import { MutableDataFrame, PanelData, LoadingState } from '@grafana/data';
import { PyroscopeStateContext } from '../../../../../../components/PyroscopeState/context';
import { stringifyPyroscopeColor } from '../../../../../../utils/translation';
import { FieldColor, FieldColorModeId } from '@grafana/schema';

import { PieChartProps } from 'grafana-pyroscope/public/app/pages/tagExplorer/components/TotalSamplesChart/PieChart';

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
