/*
 tm1640_led package
*/
//% weight=10 icon="8" color=#2896ff
namespace tm1640_led {

    let Digitaltube: TM1640LEDs
    let TM1640_CMD1 = 0x40;
    let TM1640_CMD2 = 0xC0;
    let TM1640_CMD3 = 0x80;
    let _SEGMENTS = [0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F, 0x77, 0x7C, 0x39, 0x5E, 0x79, 0x71];

    /**
        * TM1640 LED display
        */
    export class TM1640LEDs {
        buf: Buffer;
        clk: DigitalPin;
        dio: DigitalPin;
        _ON: number;
        brightness: number;
        count: number;  // number of LEDs

        /**
         * initial TM1640
         */
        init(): void {
            pins.digitalWritePin(this.clk, 0);
            pins.digitalWritePin(this.dio, 0);
            this._ON = 8;
            this.buf = pins.createBuffer(this.count);
            this.clear();
        }

        /**
         * Start 
         */
        _start() {
            pins.digitalWritePin(this.dio, 0);
            pins.digitalWritePin(this.clk, 0);
        }

        /**
         * Stop
         */
        _stop() {
            pins.digitalWritePin(this.dio, 0);
            pins.digitalWritePin(this.clk, 1);
            pins.digitalWritePin(this.dio, 1);
        }

        /**
         * send command1
         */
        _write_data_cmd() {
            this._start();
            this._write_byte(TM1640_CMD1);
            this._stop();
        }

        /**
         * send command3
         */
        _write_dsp_ctrl() {
            this._start();
            this._write_byte(TM1640_CMD3 | this._ON | this.brightness);
            this._stop();
        }

        /**
         * send a byte to 2-wire interface
         */
        _write_byte(b: number) {
            for (let i = 0; i < 8; i++) {
                pins.digitalWritePin(this.clk, 0);
                pins.digitalWritePin(this.dio, (b >> i) & 1);
                pins.digitalWritePin(this.clk, 1);

            }
            pins.digitalWritePin(this.clk, 1);
            pins.digitalWritePin(this.clk, 0);
        }

        intensity(val: number = 7) {
            if (val < 1) {
                this.off();
                return;
            }
            if (val > 8) val = 8;
            this._ON = 8;
            this.brightness = val - 1;
            this._write_data_cmd();
            this._write_dsp_ctrl();
        }

        /**
         * set data to TM1640, with given bit
         */
        _dat(bit: number, dat: number) {
            this._write_data_cmd();
            this._start();
            this._write_byte(TM1640_CMD2 | (bit % this.count))
            this._write_byte(dat);
            this._stop();
            this._write_dsp_ctrl();
        }


        showbit(num: number = 5, bit: number = 0) {
            this.buf[bit % this.count] = _SEGMENTS[num % 16]
            this._dat(bit, _SEGMENTS[num % 16])
        }

        showNumber(num: number) {
            if (num < 0) {
                this._dat(0, 0x40) // '-'
                num = -num
            }
            else
                this.showbit(Math.idiv(num, 1000) % 10)
            this.showbit(num % 10, 3)
            this.showbit(Math.idiv(num, 10) % 10, 2)
            this.showbit(Math.idiv(num, 100) % 10, 1)
        }

        showHex(num: number) {
            if (num < 0) {
                this._dat(0, 0x40) // '-'
                num = -num
            }
            else
                this.showbit((num >> 12) % 16)
            this.showbit(num % 16, 3)
            this.showbit((num >> 4) % 16, 2)
            this.showbit((num >> 8) % 16, 1)
        }


        showDP(bit: number = 1, show: boolean = true) {
            bit = bit % this.count
            if (show) this._dat(bit, this.buf[bit] | 0x80)
            else this._dat(bit, this.buf[bit] & 0x7F)
        }

        clear() {
            for (let i = 0; i < this.count; i++) {
                this._dat(i, 0)
                this.buf[i] = 0
            }
        }

        on() {
            this._ON = 8;
            this._write_data_cmd();
            this._write_dsp_ctrl();
        }

        off() {
            this._ON = 0;
            this._write_data_cmd();
            this._write_dsp_ctrl();
        }
    }

    export enum DisplayPin {
        //% block="P0"
        P0 = 0x00,        
        //% block="P1"
        P1 = 0x01,
        //% block="P2"
        P2 = 0x02,
        //% block="P3"
        P3 = 0x03,        
        //% block="P4"
        P4 = 0x04,
        //% block="P5"
        P5 = 0x05,
        //% block="P6"
        P6 = 0x06,        
        //% block="P7"
        P7 = 0x07,
        //% block="P8"
        P8 = 0x08,
        //% block="P9"
        P9 = 0x09,        
        //% block="P10"
        P10 = 0x0a,
        //% block="P11"
        P11 = 0x0b,   
        //% block="P12"
        P12 = 0x0c,        
        //% block="P13"
        P13 = 0x0d,
        //% block="P14"
        P14 = 0x0e,
        //% block="P15"
        P15 = 0x0f,             
        //% block="P16"
        P16 = 0x10
    }
    /**
     * 创建 TM1640 对象.
     * @param clk the CLK pin for TM1640, eg: DigitalPin.P1
     * @param dio the DIO pin for TM1640, eg: DigitalPin.P2
     * @param intensity the brightness of the LED, eg: 7
     * @param count the count of the LED, eg: 4
     */
    function TM1640create(clk: DigitalPin, dio: DigitalPin, intensity: number, count: number): TM1640LEDs {
        let digitaltube = new TM1640LEDs();
        digitaltube.clk = clk;
        digitaltube.dio = dio;
        if ((count < 1) || (count > 5)) count = 4;
        digitaltube.count = count;
        digitaltube.brightness = intensity;
        digitaltube.init();
        return digitaltube;
    }

    function getDigitalPin(pin: DisplayPin): DigitalPin {
        switch (pin)
        {
            case DisplayPin.P0: return DigitalPin.P0;
            case DisplayPin.P1: return DigitalPin.P1;
            case DisplayPin.P2: return DigitalPin.P2;
            case DisplayPin.P3: return DigitalPin.P3;
            case DisplayPin.P4: return DigitalPin.P4;
            case DisplayPin.P5: return DigitalPin.P5;
            case DisplayPin.P6: return DigitalPin.P6;
            case DisplayPin.P7: return DigitalPin.P7;
            case DisplayPin.P8: return DigitalPin.P8;
            case DisplayPin.P9: return DigitalPin.P9;
            case DisplayPin.P10: return DigitalPin.P10;
            case DisplayPin.P11: return DigitalPin.P11;
            case DisplayPin.P12: return DigitalPin.P12;
            case DisplayPin.P13: return DigitalPin.P13;
            case DisplayPin.P14: return DigitalPin.P14;
            case DisplayPin.P15: return DigitalPin.P15;
            case DisplayPin.P16: return DigitalPin.P16;
        }
    }

    /**
       * @param clk the CLK pin for TM1640, eg: DisplayPin.P1
       * @param dio the DIO pin for TM1640, eg: DisplayPin.P2
       * @param intensity the brightness of the LED, eg: 7
       * @param count the count of the LED, eg: 4
       */
    //% weight=98 blockId=digitaltube block="Initialize digital display module clk|%clk| dio|%dio| intensity %intensity|LED count %count"
    //% inlineInputMode=inline
    export function digitaltube(clk: DisplayPin, dio: DisplayPin, intensity: number, count: number) {
        let clkDigital = getDigitalPin(clk);
        let dioDigital = getDigitalPin(dio);
        Digitaltube = TM1640create(clkDigital, dioDigital, intensity, count);
    }

    /**
     * show a number. 
     * @param num is a number, eg: 0
     */
    //% weight=96 blockId=showNumber block="digitaltube show number| %num"
    export function showNumber(num: number) {
        Digitaltube.showNumber(num);
    }

    /**
     * show a number in given position. 
     * @param num number will show, eg: 5
     * @param bit the position of the LED, eg: 0
     */
    //% weight=94 blockId=showbit block="digitaltube show digit| %num|at %bit"
    export function showbit(num: number = 5, bit: number = 0) {
        Digitaltube.showbit(num, bit);
    }

    /**
     * show a hex number. 
     * @param num is a hex number, eg: 0
     */
    //% weight=92 blockId=showhex block="digitaltube show hex number| %num"
    export function showhex(num: number) {
        Digitaltube.showHex(num);
    }

    /**
     * show or hide dot point. 
     * @param bit is the position, eg: 1
     * @param show is show/hide dp, eg: true
     */
    //% weight=90 blockId=showDP block="digitaltube DotPoint at| %bit|show %show"
    export function showDP(bit: number = 1, show: boolean = true) {
        Digitaltube.showDP(bit, show);
    }

    /**
     * set TM1640 intensity, range is [0-8], 0 is off.
     * @param val the brightness of the TM1640, eg: 7
     */
    //% weight=88 blockId=intensity block=" digitaltube set intensity %val"
    export function intensity(val: number = 7) {
        Digitaltube.intensity(val);
    }

    /**
     * turn off LED. 
     */
    //% weight=86 blockId=off block="turn off digitaltube"
    export function off() {
        Digitaltube.off();
    }

    /**
     * turn on LED. 
     */
    //% weight=84 blockId=on block="turn on digitaltube"
    export function on() {
        Digitaltube.on();
    }

    /**
     * clear LED. 
     */
    //%weight=82 blockId=clear blockGap=50 block="clear digitaltube"
    export function clear() {
        Digitaltube.clear();
    }
    
}
