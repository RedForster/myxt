import { Scene } from 'phaser';
import { HomepageView } from '../ui/HomepageView';

export class Homepage extends Scene {
    private view?: HomepageView;

    constructor() {
        super('Homepage');
    }

    create(): void {
        this.view = new HomepageView(this);
        this.view.build({ showLoading: false });
        this.view.showReady(() => {
            this.scene.start('LevelSelection');
        }, {
            animateLoadingHide: false,
            message: '欢迎回来，准备开始！'
        });
    }
}