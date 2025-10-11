import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  open: boolean;
  question: string;
  onSubmit: (answer: string) => void;
}

const ClarifyModal = ({ open, question, onSubmit }: Props) => {
  const [value, setValue] = useState('');
  return (
    <Dialog open={open}>
      <DialogContent className="space-y-4">
        <DialogHeader>
          <DialogTitle>Clarification Needed</DialogTitle>
        </DialogHeader>
        <p>{question}</p>
        <Textarea value={value} onChange={(e) => setValue(e.target.value)} />
        <Button onClick={() => { onSubmit(value); setValue(''); }}>Submit</Button>
      </DialogContent>
    </Dialog>
  );
};

export default ClarifyModal;
