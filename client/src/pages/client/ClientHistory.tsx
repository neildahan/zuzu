import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HistoryContent from '../../components/history/HistoryContent';

export default function ClientHistory() {
  const { cid } = useParams();
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">{t('history.title')}</h1>
      <HistoryContent clientId={cid} />
    </div>
  );
}
